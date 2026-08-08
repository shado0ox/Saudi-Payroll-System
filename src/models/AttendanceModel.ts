import { db } from '../database/postgres';
import { AttendanceRecord } from '../types';

function mapAttendance(row: any): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    period: row.period,
    workingDays: Number(row.working_days),
    presentDays: Number(row.present_days),
    unpaidAbsenceDays: Number(row.unpaid_absence_days),
    overtimeHours: Number(row.overtime_hours),
    notes: row.notes || undefined,
    updatedAt: row.updated_at
  } as AttendanceRecord;
}

export class AttendanceModel {

  /**
   * Get attendance records for a specific period.
   * If companyId is supplied, records are restricted to that company.
   */
  static async getForPeriod(
    period: string,
    companyId?: string
  ): Promise<AttendanceRecord[]> {

    const result = companyId
      ? await db.query(
          `
          SELECT a.*
          FROM attendance a
          INNER JOIN employees e
            ON e.id = a.employee_id
          WHERE a.period = $1
            AND e.company_id = $2
          ORDER BY e.employee_code
          `,
          [period, companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM attendance
          WHERE period = $1
          ORDER BY employee_id
          `,
          [period]
        );

    return result.rows.map(mapAttendance);
  }


  /**
   * Get attendance for one employee / period.
   */
  static async getByEmployeeAndPeriod(
    employeeId: string,
    period: string,
    companyId?: string
  ): Promise<AttendanceRecord | undefined> {

    const result = companyId
      ? await db.query(
          `
          SELECT a.*
          FROM attendance a
          INNER JOIN employees e
            ON e.id = a.employee_id
          WHERE a.employee_id = $1
            AND a.period = $2
            AND e.company_id = $3
          LIMIT 1
          `,
          [
            employeeId,
            period,
            companyId
          ]
        )
      : await db.query(
          `
          SELECT *
          FROM attendance
          WHERE employee_id = $1
            AND period = $2
          LIMIT 1
          `,
          [
            employeeId,
            period
          ]
        );

    return result.rows[0]
      ? mapAttendance(result.rows[0])
      : undefined;
  }


  /**
   * Insert or update attendance record.
   */
  static async upsert(
    record: Omit<
      AttendanceRecord,
      'id' | 'updatedAt'
    > & {
      id?: string;
    },
    companyId?: string
  ): Promise<AttendanceRecord> {

    // Make sure employee belongs to active company
    if (companyId) {

      const employeeCheck =
        await db.query(
          `
          SELECT id
          FROM employees
          WHERE id = $1
            AND company_id = $2
          LIMIT 1
          `,
          [
            record.employeeId,
            companyId
          ]
        );

      if (
        employeeCheck.rows.length === 0
      ) {
        throw new Error(
          'Employee not found in active company.'
        );
      }
    }


    const existing =
      await this.getByEmployeeAndPeriod(
        record.employeeId,
        record.period,
        companyId
      );


    if (existing) {

      const result =
        await db.query(
          `
          UPDATE attendance
          SET
            working_days = $1,
            present_days = $2,
            unpaid_absence_days = $3,
            overtime_hours = $4,
            notes = $5,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING *
          `,
          [
            record.workingDays ?? 30,
            record.presentDays ?? 0,
            record.unpaidAbsenceDays ?? 0,
            record.overtimeHours ?? 0,
            record.notes || null,
            existing.id
          ]
        );

      return mapAttendance(
        result.rows[0]
      );
    }


    const id =
      record.id ||
      `att-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;


    const result =
      await db.query(
        `
        INSERT INTO attendance (
          id,
          employee_id,
          period,
          working_days,
          present_days,
          unpaid_absence_days,
          overtime_hours,
          notes,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          CURRENT_TIMESTAMP
        )
        RETURNING *
        `,
        [
          id,
          record.employeeId,
          record.period,
          record.workingDays ?? 30,
          record.presentDays ?? 0,
          record.unpaidAbsenceDays ?? 0,
          record.overtimeHours ?? 0,
          record.notes || null
        ]
      );

    return mapAttendance(
      result.rows[0]
    );
  }
}