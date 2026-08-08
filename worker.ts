import { db } from './src/database/postgres';

import { EmployeeModel } from './src/models/EmployeeModel';
import { AttendanceModel } from './src/models/AttendanceModel';
import { PayrollModel } from './src/models/PayrollModel';
import { SettingsModel } from './src/models/SettingsModel';

import { PayrollCalculationService } from './src/services/payrollCalculationService';

import { logger } from './src/utils/logger';

import { PayrollRun, Payslip } from './src/types';


interface CompanyPayrollResult {
  companyId: string;
  companyName: string;
  period: string;
  runCode: string;
  employeesProcessed: number;
  totalGrossPay: number;
  totalNetPay: number;
}


/**
 * Automated payroll worker.
 *
 * If companyId is provided:
 *   Process only that company.
 *
 * If companyId is omitted:
 *   Process all active companies.
 */
export async function runPayrollWorkerJob(
  periodStr?: string,
  targetCompanyId?: string
) {

  const period =
    periodStr ||
    new Date()
      .toISOString()
      .substring(0, 7);


  const startTime =
    Date.now();


  logger.info(
    `⚡ [WORKER] Starting payroll job for period ${period}`
  );


  /*
   * Get active companies directly
   * from PostgreSQL.
   */
  const companyResult =
    targetCompanyId
      ? await db.query(
          `
          SELECT
            id,
            code,
            name
          FROM companies
          WHERE id = $1
            AND status = 'active'
          `,
          [targetCompanyId]
        )
      : await db.query(
          `
          SELECT
            id,
            code,
            name
          FROM companies
          WHERE status = 'active'
          ORDER BY name
          `
        );


  if (
    companyResult.rows.length === 0
  ) {

    logger.warn(
      '⚠️ [WORKER] No active companies found.'
    );


    return {
      status: 'completed',
      period,
      companiesProcessed: 0,
      employeesProcessed: 0,
      results: [],
      durationMs:
        Date.now() - startTime
    };
  }


  const results:
    CompanyPayrollResult[] = [];


  let totalEmployeesProcessed = 0;


  /*
   * Process every active company
   * independently.
   */
  for (
    const company of
    companyResult.rows
  ) {

    const companyId =
      company.id as string;

    const companyName =
      company.name as string;


    logger.info(
      `🏢 [WORKER] Processing ${companyName} (${companyId})`
    );


    /*
     * Company-specific configuration
     * from PostgreSQL.
     */
    const config =
      await SettingsModel.getConfig(
        companyId
      );


    /*
     * Active employees belonging
     * only to this company.
     */
    const employees =
      (
        await EmployeeModel.getAll(
          companyId
        )
      ).filter(
        employee =>
          employee.status === 'active'
      );


    /*
     * Attendance for this company
     * and payroll period.
     */
    const attendanceRecords =
      await AttendanceModel.getForPeriod(
        period,
        companyId
      );


    /*
     * IDs must be unique between
     * different companies.
     */
    const safeCompanyId =
      companyId.replace(
        /[^a-zA-Z0-9_-]/g,
        ''
      );


    const runId =
      `pr-${safeCompanyId}-${period}`;


    const companyCode =
      String(
        company.code ||
        safeCompanyId
      )
        .toUpperCase()
        .replace(
          /[^A-Z0-9]/g,
          ''
        );


    const runCode =
      `PAY-${companyCode}-${period.replace('-', '')}`;


    const payslips:
      Payslip[] = [];


    let totalGross = 0;
    let totalDeductions = 0;
    let totalEmployerContrib = 0;
    let totalNet = 0;


    /*
     * Calculate each employee.
     */
    for (
      const employee of employees
    ) {

      const attendance =
        attendanceRecords.find(
          record =>
            record.employeeId ===
            employee.id
        );


      const payslip =
        PayrollCalculationService
          .calculateEmployeePayslip(
            employee,
            attendance,
            period,
            config,
            runId
          );


      payslips.push(
        payslip
      );


      totalGross +=
        payslip.grossPay;


      totalDeductions +=
        payslip.totalDeductions;


      totalEmployerContrib +=
        payslip.socialSecurityEmployer;


      totalNet +=
        payslip.netPay;
    }


    /*
     * Build payroll run.
     */
    const payrollRun:
      PayrollRun = {

      id:
        runId,

      companyId,

      runCode,

      title:
        `Automated Payroll ${period}`,

      period,

      status:
        'calculated',

      totalEmployees:
        employees.length,

      totalGrossPay:
        Math.round(
          totalGross * 100
        ) / 100,

      totalDeductions:
        Math.round(
          totalDeductions * 100
        ) / 100,

      totalEmployerContributions:
        Math.round(
          totalEmployerContrib * 100
        ) / 100,

      totalNetPay:
        Math.round(
          totalNet * 100
        ) / 100,

      payslips,

      createdAt:
        new Date()
          .toISOString(),

      calculatedAt:
        new Date()
          .toISOString()
    };


    /*
     * PostgreSQL payroll_runs +
     * payroll_payslips.
     */
    const savedRun =
      await PayrollModel.saveRun(
        payrollRun
      );


    /*
     * PostgreSQL Audit Log.
     */
    await db.query(
      `
      INSERT INTO audit_logs (
        id,
        company_id,
        timestamp,
        action,
        user_name,
        details,
        module
      )
      VALUES (
        $1,
        $2,
        CURRENT_TIMESTAMP,
        $3,
        $4,
        $5,
        $6
      )
      `,
      [
        `log-worker-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}`,

        companyId,

        'BACKGROUND_WORKER_EXECUTION',

        'Payroll Worker',

        `Processed automated payroll ${savedRun.runCode} for ${employees.length} employees. Total net payroll: SAR ${savedRun.totalNetPay}`,

        'Payroll'
      ]
    );


    totalEmployeesProcessed +=
      employees.length;


    results.push({
      companyId,

      companyName,

      period,

      runCode:
        savedRun.runCode,

      employeesProcessed:
        employees.length,

      totalGrossPay:
        savedRun.totalGrossPay,

      totalNetPay:
        savedRun.totalNetPay
    });


    logger.info(
      `✅ [WORKER] ${companyName}: ${employees.length} employees, Net SAR ${savedRun.totalNetPay}`
    );
  }


  const durationMs =
    Date.now() - startTime;


  logger.info(
    `✅ [WORKER] Completed payroll for ${results.length} companies in ${durationMs}ms`
  );


  return {
    status:
      'completed',

    period,

    companiesProcessed:
      results.length,

    employeesProcessed:
      totalEmployeesProcessed,

    results,

    durationMs
  };
}


/*
 * CLI execution:
 *
 * npm run worker
 */
if (
  import.meta.url ===
  `file://${process.argv[1]}`
) {

  runPayrollWorkerJob()
    .then(() => {
      process.exit(0);
    })
    .catch(
      error => {

        logger.error(
          'Payroll worker failed:',
          error
        );

        process.exit(1);
      }
    );
}