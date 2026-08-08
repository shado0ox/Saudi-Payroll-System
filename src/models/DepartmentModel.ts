import { db } from '../database/postgres';
import { Department } from '../types';

function mapDepartment(row: any): Department {
  return {
    id: row.id,
    companyId: row.company_id,
    code: row.code,
    name: row.name,
    headName: row.head_name,
    employeeCount: Number(row.employee_count || 0)
  } as Department;
}

export class DepartmentModel {

  static async getAll(companyId?: string): Promise<Department[]> {

    const result = companyId
      ? await db.query(
          `SELECT *
           FROM departments
           WHERE company_id = $1
           ORDER BY name`,
          [companyId]
        )
      : await db.query(
          `SELECT *
           FROM departments
           ORDER BY name`
        );

    return result.rows.map(mapDepartment);
  }
}