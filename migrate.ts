import { db } from './src/database/postgres';
import { logger } from './src/utils/logger';

export async function runMigrationScript() {
  logger.info(
    '🚀 Starting PostgreSQL database migration check...'
  );

  const start = Date.now();

  try {

    /*
     * Required production tables.
     *
     * We create only missing infrastructure.
     * No demo companies, employees or attendance.
     */

    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        company_id VARCHAR(50) PRIMARY KEY
          REFERENCES companies(id)
          ON DELETE CASCADE,

        config JSONB NOT NULL
          DEFAULT '{}'::jsonb,

        created_at TIMESTAMP WITH TIME ZONE
          DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP WITH TIME ZONE
          DEFAULT CURRENT_TIMESTAMP
      )
    `);


    await db.query(`
      CREATE TABLE IF NOT EXISTS payroll_payslips (
        id VARCHAR(100) PRIMARY KEY,

        company_id VARCHAR(50) NOT NULL
          REFERENCES companies(id)
          ON DELETE CASCADE,

        run_id VARCHAR(100) NOT NULL
          REFERENCES payroll_runs(id)
          ON DELETE CASCADE,

        employee_id VARCHAR(100) NOT NULL
          REFERENCES employees(id)
          ON DELETE CASCADE,

        period VARCHAR(7) NOT NULL,

        payslip_data JSONB NOT NULL,

        created_at TIMESTAMP WITH TIME ZONE
          DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP WITH TIME ZONE
          DEFAULT CURRENT_TIMESTAMP
      )
    `);


    /*
     * Performance indexes.
     */
    await db.query(`
      CREATE INDEX IF NOT EXISTS
        idx_payroll_payslips_run
      ON payroll_payslips(run_id)
    `);


    await db.query(`
      CREATE INDEX IF NOT EXISTS
        idx_payroll_payslips_employee
      ON payroll_payslips(employee_id)
    `);


    await db.query(`
      CREATE INDEX IF NOT EXISTS
        idx_payroll_payslips_company_period
      ON payroll_payslips(
        company_id,
        period
      )
    `);


    /*
     * Verify current database contents.
     */
    const companyResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM companies
      `);


    const employeeResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM employees
      `);


    const departmentResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM departments
      `);


    const attendanceResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM attendance
      `);


    const payrollResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM payroll_runs
      `);


    const payslipResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM payroll_payslips
      `);


    const journalResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM accounting_journal_entries
      `);


    const settingsResult =
      await db.query(`
        SELECT COUNT(*)::int AS count
        FROM system_settings
      `);


    const durationMs =
      Date.now() - start;


    const stats = {
      companies:
        companyResult.rows[0].count,

      departments:
        departmentResult.rows[0].count,

      employees:
        employeeResult.rows[0].count,

      attendanceRecords:
        attendanceResult.rows[0].count,

      payrollRuns:
        payrollResult.rows[0].count,

      payslips:
        payslipResult.rows[0].count,

      journalEntries:
        journalResult.rows[0].count,

      companySettings:
        settingsResult.rows[0].count
    };


    logger.info(
      `✅ PostgreSQL migration check completed in ${durationMs}ms.`
    );

    logger.info(
      `   - Companies: ${stats.companies}`
    );

    logger.info(
      `   - Departments: ${stats.departments}`
    );

    logger.info(
      `   - Employees: ${stats.employees}`
    );

    logger.info(
      `   - Attendance: ${stats.attendanceRecords}`
    );

    logger.info(
      `   - Payroll Runs: ${stats.payrollRuns}`
    );

    logger.info(
      `   - Payslips: ${stats.payslips}`
    );

    logger.info(
      `   - Journal Entries: ${stats.journalEntries}`
    );

    logger.info(
      `   - Settings: ${stats.companySettings}`
    );


    return {
      status: 'success',
      message:
        'PostgreSQL database schema verified successfully. No demo data was seeded.',
      durationMs,
      stats
    };

  } catch (err: any) {

    logger.error(
      '❌ PostgreSQL migration failed:',
      err
    );

    throw err;
  }
}


/*
 * Direct CLI execution:
 *
 * npm run migrate
 */
if (
  import.meta.url ===
  `file://${process.argv[1]}`
) {

  runMigrationScript()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}