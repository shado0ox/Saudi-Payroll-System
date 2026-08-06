import { getDatabase } from './src/models/db';
import { EmployeeModel } from './src/models/EmployeeModel';
import { AttendanceModel } from './src/models/AttendanceModel';
import { PayrollModel } from './src/models/PayrollModel';
import { PayrollCalculationService } from './src/services/payrollCalculationService';
import { logger } from './src/utils/logger';
import { PayrollRun, Payslip } from './src/types';

export async function runPayrollWorkerJob(periodStr?: string) {
  const period = periodStr || new Date().toISOString().substring(0, 7);
  logger.info(`⚡ [WORKER] Starting automated background payroll calculation job for period: ${period}`);

  const startTime = Date.now();
  const db = getDatabase();
  const config = db.config;

  const employees = EmployeeModel.getAll().filter(e => e.status === 'active');
  const attendanceRecords = AttendanceModel.getForPeriod(period);

  const runId = `pr-${period}`;
  const runCode = `PAY-${period.replace('-', '')}`;

  const payslips: Payslip[] = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalEmployerContrib = 0;
  let totalNet = 0;

  for (const emp of employees) {
    const att = attendanceRecords.find(a => a.employeeId === emp.id);
    const payslip = PayrollCalculationService.calculateEmployeePayslip(emp, att, period, config, runId);

    payslips.push(payslip);
    totalGross += payslip.grossPay;
    totalDeductions += payslip.totalDeductions;
    totalEmployerContrib += payslip.socialSecurityEmployer;
    totalNet += payslip.netPay;
  }

  const payrollRun: PayrollRun = {
    id: runId,
    companyId: 'comp-101',
    runCode,
    title: `Automated Batch Run ${period}`,
    period,
    status: 'calculated',
    totalEmployees: employees.length,
    totalGrossPay: Math.round(totalGross * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    totalEmployerContributions: Math.round(totalEmployerContrib * 100) / 100,
    totalNetPay: Math.round(totalNet * 100) / 100,
    payslips,
    createdAt: new Date().toISOString(),
    calculatedAt: new Date().toISOString()
  };

  PayrollModel.saveRun(payrollRun);

  db.auditLogs.unshift({
    id: `log-worker-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'BACKGROUND_WORKER_EXECUTION',
    user: 'Worker Process',
    details: `Processed batch payroll for ${employees.length} employees. Total Net: SAR ${payrollRun.totalNetPay}`,
    module: 'Worker'
  });

  const durationMs = Date.now() - startTime;
  logger.info(`✅ [WORKER] Completed payroll processing in ${durationMs}ms. Net Payroll: ${payrollRun.totalNetPay}`);

  return {
    status: 'completed',
    period,
    runCode,
    employeesProcessed: employees.length,
    totalGrossPay: payrollRun.totalGrossPay,
    totalNetPay: payrollRun.totalNetPay,
    durationMs
  };
}

// If invoked directly from CLI (npm run worker)
if (import.meta.url === `file://${process.argv[1]}`) {
  runPayrollWorkerJob()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Worker failed:', err);
      process.exit(1);
    });
}
