import { db } from '../database/postgres';
import { PayrollRun, Payslip } from '../types';


function mapPayslip(row: any): Payslip {
  return row.payslip_data as Payslip;
}


async function loadPayslips(
  runId: string,
  companyId?: string
): Promise<Payslip[]> {

  const result = companyId
    ? await db.query(
        `
        SELECT payslip_data
        FROM payroll_payslips
        WHERE run_id = $1
          AND company_id = $2
        ORDER BY created_at
        `,
        [runId, companyId]
      )
    : await db.query(
        `
        SELECT payslip_data
        FROM payroll_payslips
        WHERE run_id = $1
        ORDER BY created_at
        `,
        [runId]
      );

  return result.rows.map(mapPayslip);
}


async function mapPayrollRun(
  row: any
): Promise<PayrollRun> {

  const payslips =
    await loadPayslips(
      row.id,
      row.company_id
    );

  return {
    id: row.id,

    companyId:
      row.company_id,

    runCode:
      row.run_code,

    title:
      row.title,

    period:
      row.period,

    status:
      row.status,

    totalEmployees:
      Number(row.total_employees),

    totalGrossPay:
      Number(row.total_gross_pay),

    totalDeductions:
      Number(row.total_deductions),

    totalEmployerContributions:
      Number(
        row.total_employer_contributions
      ),

    totalNetPay:
      Number(row.total_net_pay),

    payslips,

    createdAt:
      row.created_at,

    calculatedAt:
      row.calculated_at || undefined,

    approvedAt:
      row.approved_at || undefined,

    approvedBy:
      row.approved_by || undefined

  } as PayrollRun;
}


export class PayrollModel {

  static async getAllRuns(
    companyId?: string
  ): Promise<PayrollRun[]> {

    const result = companyId
      ? await db.query(
          `
          SELECT *
          FROM payroll_runs
          WHERE company_id = $1
          ORDER BY period DESC, created_at DESC
          `,
          [companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM payroll_runs
          ORDER BY period DESC, created_at DESC
          `
        );


    return Promise.all(
      result.rows.map(mapPayrollRun)
    );
  }


  static async getRunById(
    id: string,
    companyId?: string
  ): Promise<PayrollRun | undefined> {

    const result = companyId
      ? await db.query(
          `
          SELECT *
          FROM payroll_runs
          WHERE id = $1
            AND company_id = $2
          LIMIT 1
          `,
          [id, companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM payroll_runs
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );


    if (!result.rows[0]) {
      return undefined;
    }


    return mapPayrollRun(
      result.rows[0]
    );
  }


  static async getRunByPeriod(
    period: string,
    companyId?: string
  ): Promise<PayrollRun | undefined> {

    const result = companyId
      ? await db.query(
          `
          SELECT *
          FROM payroll_runs
          WHERE period = $1
            AND company_id = $2
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [period, companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM payroll_runs
          WHERE period = $1
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [period]
        );


    if (!result.rows[0]) {
      return undefined;
    }


    return mapPayrollRun(
      result.rows[0]
    );
  }


  static async saveRun(
    run: PayrollRun
  ): Promise<PayrollRun> {

    if (!run.companyId) {
      throw new Error(
        'companyId is required when saving payroll run.'
      );
    }


    await db.query(
      `
      INSERT INTO payroll_runs (
        id,
        company_id,
        run_code,
        title,
        period,
        status,
        total_employees,
        total_gross_pay,
        total_deductions,
        total_employer_contributions,
        total_net_pay,
        created_at,
        calculated_at,
        approved_at,
        approved_by
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15
      )

      ON CONFLICT (id)
      DO UPDATE SET

        company_id =
          EXCLUDED.company_id,

        run_code =
          EXCLUDED.run_code,

        title =
          EXCLUDED.title,

        period =
          EXCLUDED.period,

        status =
          EXCLUDED.status,

        total_employees =
          EXCLUDED.total_employees,

        total_gross_pay =
          EXCLUDED.total_gross_pay,

        total_deductions =
          EXCLUDED.total_deductions,

        total_employer_contributions =
          EXCLUDED.total_employer_contributions,

        total_net_pay =
          EXCLUDED.total_net_pay,

        calculated_at =
          EXCLUDED.calculated_at,

        approved_at =
          EXCLUDED.approved_at,

        approved_by =
          EXCLUDED.approved_by
      `,
      [
        run.id,
        run.companyId,
        run.runCode,
        run.title,
        run.period,
        run.status,

        run.totalEmployees || 0,
        run.totalGrossPay || 0,
        run.totalDeductions || 0,

        run.totalEmployerContributions || 0,

        run.totalNetPay || 0,

        run.createdAt ||
          new Date().toISOString(),

        run.calculatedAt || null,

        run.approvedAt || null,

        run.approvedBy || null
      ]
    );


    /*
     * Replace payslips belonging
     * to this payroll run.
     */
    await db.query(
      `
      DELETE FROM payroll_payslips
      WHERE run_id = $1
        AND company_id = $2
      `,
      [
        run.id,
        run.companyId
      ]
    );


    for (
      const payslip of
      run.payslips || []
    ) {

      const payslipId =
        payslip.id ||
        `ps-${run.id}-${payslip.employeeId}`;


      await db.query(
        `
        INSERT INTO payroll_payslips (
          id,
          company_id,
          run_id,
          employee_id,
          period,
          payslip_data
        )
        VALUES (
          $1,$2,$3,$4,$5,$6::jsonb
        )
        `,
        [
          payslipId,
          run.companyId,
          run.id,
          payslip.employeeId,
          run.period,
          JSON.stringify(payslip)
        ]
      );
    }


    const saved =
      await this.getRunById(
        run.id,
        run.companyId
      );


    if (!saved) {
      throw new Error(
        'Payroll run could not be loaded after saving.'
      );
    }


    return saved;
  }


  static async updateStatus(
    id: string,
    status: string,
    approvedBy?: string,
    companyId?: string
  ): Promise<PayrollRun | null> {

    const result = companyId
      ? await db.query(
          `
          UPDATE payroll_runs
          SET
            status = $1,

            approved_at =
              CASE
                WHEN $1 = 'approved'
                THEN CURRENT_TIMESTAMP
                ELSE approved_at
              END,

            approved_by =
              CASE
                WHEN $1 = 'approved'
                THEN $2
                ELSE approved_by
              END

          WHERE id = $3
            AND company_id = $4

          RETURNING *
          `,
          [
            status,
            approvedBy || null,
            id,
            companyId
          ]
        )
      : await db.query(
          `
          UPDATE payroll_runs
          SET
            status = $1,

            approved_at =
              CASE
                WHEN $1 = 'approved'
                THEN CURRENT_TIMESTAMP
                ELSE approved_at
              END,

            approved_by =
              CASE
                WHEN $1 = 'approved'
                THEN $2
                ELSE approved_by
              END

          WHERE id = $3

          RETURNING *
          `,
          [
            status,
            approvedBy || null,
            id
          ]
        );


    if (!result.rows[0]) {
      return null;
    }


    return mapPayrollRun(
      result.rows[0]
    );
  }


  static async getPayslipById(
    payslipId: string,
    companyId?: string
  ): Promise<Payslip | undefined> {

    const result = companyId
      ? await db.query(
          `
          SELECT payslip_data
          FROM payroll_payslips
          WHERE id = $1
            AND company_id = $2
          LIMIT 1
          `,
          [
            payslipId,
            companyId
          ]
        )
      : await db.query(
          `
          SELECT payslip_data
          FROM payroll_payslips
          WHERE id = $1
          LIMIT 1
          `,
          [payslipId]
        );


    return result.rows[0]
      ? mapPayslip(result.rows[0])
      : undefined;
  }


  static async deleteRun(
    id: string,
    companyId: string
  ): Promise<boolean> {

    const result =
      await db.query(
        `
        DELETE FROM payroll_runs
        WHERE id = $1
          AND company_id = $2
        `,
        [
          id,
          companyId
        ]
      );


    return (
      result.rowCount ?? 0
    ) > 0;
  }
}