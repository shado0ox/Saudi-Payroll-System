import { Employee, AttendanceRecord, SystemConfig, Payslip, PayslipItem } from '../types';
import { calculateProgressiveTax, calculateSocialSecurity } from '../utils/taxCalculator';
import { roundMoney } from '../utils/currency';

export class PayrollCalculationService {
  /**
   * Service 1: Core Calculation Engine for individual employee payslip calculation
   */
  static calculateEmployeePayslip(
    employee: Employee,
    attendance: AttendanceRecord | undefined,
    period: string,
    config: SystemConfig,
    payrollRunId: string
  ): Payslip {
    const workingDays = attendance?.workingDays || config.standardMonthlyWorkDays || 30;
    const absentDays = attendance?.unpaidAbsenceDays || 0;
    const overtimeHours = attendance?.overtimeHours || 0;

    // 1. Basic & Allowances
    const basicSalary = employee.basicSalary;
    const housingAllowance = employee.housingAllowance || 0;
    const transportAllowance = employee.transportAllowance || 0;

    // Custom Allowances
    const customAllowancesTotal = employee.customAllowances.reduce((acc, a) => acc + a.amount, 0);

    // 2. Overtime calculation
    // Hourly rate = (Basic + Housing) / (22 days * 8 hours) = total monthly fixed / 176 hours approx
    const monthlyFixedSalary = basicSalary + housingAllowance;
    const hourlyRate = monthlyFixedSalary / 176;
    const overtimeRate = config.overtimeHourlyMultiplier || 1.5;
    const overtimePay = roundMoney(overtimeHours * hourlyRate * overtimeRate);

    // 3. Unpaid Absence Deduction
    // Daily rate = Basic / standardMonthlyWorkDays
    const dailyRate = basicSalary / workingDays;
    const absenceDeduction = roundMoney(absentDays * dailyRate);

    // 4. Gross Salary before tax/GOSI
    const grossPay = roundMoney(
      basicSalary + housingAllowance + transportAllowance + customAllowancesTotal + overtimePay
    );

    // 5. Social Security / Pension / GOSI
    // Contributory Salary usually = Basic + Housing
    const contributorySalary = basicSalary + housingAllowance;
    const { employeeShare: socialSecurityEmployee, employerShare: socialSecurityEmployer } = calculateSocialSecurity(
      contributorySalary,
      config.socialSecurityEmployeeRate,
      config.socialSecurityEmployerRate,
      employee.socialSecurityEnrolled
    );

    // 6. Income Tax
    // Taxable income = Gross - Pre-tax deductions - Employee GOSI
    const taxableBase = Math.max(0, grossPay - socialSecurityEmployee);
    const incomeTax = employee.taxExempt 
      ? 0 
      : calculateProgressiveTax(taxableBase, config.taxBrackets);

    // 7. Other Custom Deductions
    const customDeductionsTotal = employee.customDeductions.reduce((acc, d) => acc + d.amount, 0);

    // 8. Total Deductions
    const totalDeductions = roundMoney(
      incomeTax + socialSecurityEmployee + customDeductionsTotal + absenceDeduction
    );

    // 9. Net Pay
    const netPay = roundMoney(Math.max(0, grossPay - totalDeductions));

    // Itemized breakdown items
    const items: PayslipItem[] = [
      { code: 'EARN_BASIC', label: 'Basic Salary', category: 'earnings', amount: basicSalary },
      { code: 'EARN_HOUSE', label: 'Housing Allowance', category: 'earnings', amount: housingAllowance },
      { code: 'EARN_TRANS', label: 'Transport Allowance', category: 'earnings', amount: transportAllowance }
    ];

    if (overtimePay > 0) {
      items.push({
        code: 'EARN_OT',
        label: `Overtime Pay (${overtimeHours} hrs @ ${overtimeRate}x)`,
        category: 'earnings',
        amount: overtimePay
      });
    }

    employee.customAllowances.forEach(ca => {
      items.push({
        code: `EARN_CUST_${ca.id}`,
        label: ca.name,
        category: 'earnings',
        amount: ca.amount
      });
    });

    if (socialSecurityEmployee > 0) {
      items.push({
        code: 'DED_GOSI_EMP',
        label: 'Social Insurance / GOSI (Employee Share)',
        category: 'deductions',
        amount: socialSecurityEmployee
      });
    }

    if (incomeTax > 0) {
      items.push({
        code: 'DED_TAX',
        label: 'Income Tax Withholding',
        category: 'deductions',
        amount: incomeTax
      });
    }

    if (absenceDeduction > 0) {
      items.push({
        code: 'DED_ABSENCE',
        label: `Unpaid Absence (${absentDays} days)`,
        category: 'deductions',
        amount: absenceDeduction
      });
    }

    employee.customDeductions.forEach(cd => {
      items.push({
        code: `DED_CUST_${cd.id}`,
        label: cd.name,
        category: 'deductions',
        amount: cd.amount
      });
    });

    if (socialSecurityEmployer > 0) {
      items.push({
        code: 'EMP_CONT_GOSI',
        label: 'Social Insurance / GOSI (Employer Share)',
        category: 'employer_contribution',
        amount: socialSecurityEmployer
      });
    }

    return {
      id: `ps-${payrollRunId}-${employee.id}`,
      payrollRunId,
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
      position: employee.position,
      period,
      basicSalary,
      housingAllowance,
      transportAllowance,
      overtimePay,
      otherAllowances: customAllowancesTotal,
      grossPay,
      incomeTax,
      socialSecurityEmployee,
      socialSecurityEmployer,
      otherDeductions: customDeductionsTotal + absenceDeduction,
      totalDeductions,
      netPay,
      workingDays,
      absentDays,
      overtimeHours,
      paymentMethod: 'bank_transfer',
      bankIban: employee.iban,
      items,
      generatedAt: new Date().toISOString()
    };
  }
}
