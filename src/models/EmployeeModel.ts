import { db } from '../database/postgres';
import { encryptField } from '../utils/cryptoHelper';

function mapEmployee(row: any): any {
  return {
    id: row.id,
    companyId: row.company_id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    nationalId: row.national_id,
    email: row.email,
    phone: row.phone,
    department: row.department,
    position: row.position,
    joinDate: row.join_date,
    status: row.status,
    employmentType: row.employment_type,
    bankName: row.bank_name,
    iban: row.iban,
    basicSalary: Number(row.basic_salary),
    housingAllowance: Number(row.housing_allowance),
    transportAllowance: Number(row.transport_allowance),
    customAllowances: row.custom_allowances || [],
    customDeductions: row.custom_deductions || [],
    taxExempt: row.tax_exempt,
    socialSecurityEnrolled: row.social_security_enrolled,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class EmployeeModel {

  static async getAll(companyId?: string) {
    const result = companyId
      ? await db.query(
          `SELECT * FROM employees
           WHERE company_id = $1
           ORDER BY employee_code`,
          [companyId]
        )
      : await db.query(
          `SELECT * FROM employees ORDER BY employee_code`
        );

    return result.rows.map(mapEmployee);
  }

  static async getById(id: string, companyId?: string) {
    const result = companyId
      ? await db.query(
          `SELECT * FROM employees
           WHERE id = $1 AND company_id = $2`,
          [id, companyId]
        )
      : await db.query(
          `SELECT * FROM employees WHERE id = $1`,
          [id]
        );

    return result.rows[0]
      ? mapEmployee(result.rows[0])
      : undefined;
  }

  static async getByCode(code: string, companyId?: string) {
    const result = companyId
      ? await db.query(
          `SELECT * FROM employees
           WHERE LOWER(employee_code) = LOWER($1)
           AND company_id = $2`,
          [code, companyId]
        )
      : await db.query(
          `SELECT * FROM employees
           WHERE LOWER(employee_code) = LOWER($1)`,
          [code]
        );

    return result.rows[0]
      ? mapEmployee(result.rows[0])
      : undefined;
  }

  static async create(employeeData: any, companyId: string) {
    const id = `emp-${Date.now()}`;

    const result = await db.query(
      `
      INSERT INTO employees (
        id,
        company_id,
        employee_code,
        first_name,
        last_name,
        national_id,
        email,
        phone,
        department,
        position,
        join_date,
        status,
        employment_type,
        bank_name,
        iban,
        basic_salary,
        housing_allowance,
        transport_allowance,
        custom_allowances,
        custom_deductions,
        tax_exempt,
        social_security_enrolled
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22
      )
      RETURNING *
      `,
      [
        id,
        companyId,
        employeeData.employeeCode,
        employeeData.firstName,
        employeeData.lastName,
        encryptField(employeeData.nationalId || ''),
        employeeData.email,
        employeeData.phone || '',
        employeeData.department,
        employeeData.position,
        employeeData.joinDate,
        employeeData.status || 'active',
        employeeData.employmentType || 'full_time',
        employeeData.bankName || '',
        encryptField(employeeData.iban || ''),
        employeeData.basicSalary || 0,
        employeeData.housingAllowance || 0,
        employeeData.transportAllowance || 0,
        JSON.stringify(employeeData.customAllowances || []),
        JSON.stringify(employeeData.customDeductions || []),
        Boolean(employeeData.taxExempt),
        employeeData.socialSecurityEnrolled !== false
      ]
    );

    return mapEmployee(result.rows[0]);
  }

  static async update(
    id: string,
    updates: any,
    companyId?: string
  ) {
    const current = await this.getById(id, companyId);

    if (!current) {
      return null;
    }

    const nationalId = updates.nationalId
      ? encryptField(updates.nationalId)
      : current.nationalId;

    const iban = updates.iban
      ? encryptField(updates.iban)
      : current.iban;

    const params = [
      updates.firstName ?? current.firstName,
      updates.lastName ?? current.lastName,
      nationalId,
      updates.email ?? current.email,
      updates.phone ?? current.phone,
      updates.department ?? current.department,
      updates.position ?? current.position,
      updates.joinDate ?? current.joinDate,
      updates.status ?? current.status,
      updates.employmentType ?? current.employmentType,
      updates.bankName ?? current.bankName,
      iban,
      updates.basicSalary ?? current.basicSalary,
      updates.housingAllowance ?? current.housingAllowance,
      updates.transportAllowance ?? current.transportAllowance,
      JSON.stringify(
        updates.customAllowances ??
        current.customAllowances ??
        []
      ),
      JSON.stringify(
        updates.customDeductions ??
        current.customDeductions ??
        []
      ),
      updates.taxExempt ?? current.taxExempt,
      updates.socialSecurityEnrolled ??
        current.socialSecurityEnrolled,
      id
    ];

    let where = `WHERE id = $20`;

    if (companyId) {
      params.push(companyId);
      where += ` AND company_id = $21`;
    }

    const result = await db.query(
      `
      UPDATE employees SET
        first_name = $1,
        last_name = $2,
        national_id = $3,
        email = $4,
        phone = $5,
        department = $6,
        position = $7,
        join_date = $8,
        status = $9,
        employment_type = $10,
        bank_name = $11,
        iban = $12,
        basic_salary = $13,
        housing_allowance = $14,
        transport_allowance = $15,
        custom_allowances = $16,
        custom_deductions = $17,
        tax_exempt = $18,
        social_security_enrolled = $19,
        updated_at = CURRENT_TIMESTAMP
      ${where}
      RETURNING *
      `,
      params
    );

    return result.rows[0]
      ? mapEmployee(result.rows[0])
      : null;
  }

  static async delete(id: string, companyId?: string) {
    const result = companyId
      ? await db.query(
          `DELETE FROM employees
           WHERE id = $1 AND company_id = $2`,
          [id, companyId]
        )
      : await db.query(
          `DELETE FROM employees WHERE id = $1`,
          [id]
        );

    return (result.rowCount ?? 0) > 0;
  }
}