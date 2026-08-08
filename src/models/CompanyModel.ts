import { db } from '../database/postgres';
import {
  Company,
  CompanyChartOfAccounts,
  CompanyWpsConfig,
  CompanyAccountingApiConfig
} from '../types';

function mapCompany(row: any): Company {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    crNumber: row.cr_number,
    currency: row.currency,
    currencySymbol: row.currency_symbol,
    chartOfAccounts: row.chart_of_accounts || {},
    wpsConfig: row.wps_config || {},
    accountingApiConfig: row.accounting_api_config || {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } as Company;
}

export class CompanyModel {

  static async getAllCompanies(): Promise<Company[]> {
    const result = await db.query(
      `SELECT * FROM companies ORDER BY name`
    );

    return result.rows.map(mapCompany);
  }

  static async getById(id: string): Promise<Company | undefined> {
    const result = await db.query(
      `SELECT * FROM companies WHERE id = $1 LIMIT 1`,
      [id]
    );

    return result.rows[0]
      ? mapCompany(result.rows[0])
      : undefined;
  }

  static async getByCode(code: string): Promise<Company | undefined> {
    const result = await db.query(
      `SELECT *
       FROM companies
       WHERE UPPER(code) = UPPER($1)
       LIMIT 1`,
      [code]
    );

    return result.rows[0]
      ? mapCompany(result.rows[0])
      : undefined;
  }

  static async createCompany(data: any): Promise<Company> {
    const id = `comp-${Date.now()}`;

    const result = await db.query(
      `
      INSERT INTO companies (
        id,
        code,
        name,
        cr_number,
        currency,
        currency_symbol,
        chart_of_accounts,
        wps_config,
        accounting_api_config,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
      `,
      [
        id,
        data.code,
        data.name,
        data.crNumber || null,
        data.currency || 'SAR',
        data.currencySymbol || 'ر.س',
        JSON.stringify(data.chartOfAccounts || {}),
        JSON.stringify(data.wpsConfig || {}),
        JSON.stringify(data.accountingApiConfig || {}),
        data.status || 'active'
      ]
    );

    return mapCompany(result.rows[0]);
  }

  static async updateCompany(
    id: string,
    updates: any
  ): Promise<Company | null> {

    const current = await this.getById(id);

    if (!current) {
      return null;
    }

    const result = await db.query(
      `
      UPDATE companies SET
        code = $1,
        name = $2,
        cr_number = $3,
        currency = $4,
        currency_symbol = $5,
        chart_of_accounts = $6,
        wps_config = $7,
        accounting_api_config = $8,
        status = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
      `,
      [
        updates.code ?? current.code,
        updates.name ?? current.name,
        updates.crNumber ?? current.crNumber,
        updates.currency ?? current.currency,
        updates.currencySymbol ?? current.currencySymbol,
        JSON.stringify(
          updates.chartOfAccounts ?? current.chartOfAccounts ?? {}
        ),
        JSON.stringify(
          updates.wpsConfig ?? current.wpsConfig ?? {}
        ),
        JSON.stringify(
          updates.accountingApiConfig ??
          current.accountingApiConfig ??
          {}
        ),
        updates.status ?? current.status,
        id
      ]
    );

    return result.rows[0]
      ? mapCompany(result.rows[0])
      : null;
  }

  static async updateChartOfAccounts(
    id: string,
    coa: Partial<CompanyChartOfAccounts>
  ) {
    const company = await this.getById(id);

    if (!company) return null;

    return this.updateCompany(id, {
      chartOfAccounts: {
        ...company.chartOfAccounts,
        ...coa
      }
    });
  }

  static async updateWpsConfig(
    id: string,
    wps: Partial<CompanyWpsConfig>
  ) {
    const company = await this.getById(id);

    if (!company) return null;

    return this.updateCompany(id, {
      wpsConfig: {
        ...company.wpsConfig,
        ...wps
      }
    });
  }

  static async updateAccountingApiConfig(
    id: string,
    api: Partial<CompanyAccountingApiConfig>
  ) {
    const company = await this.getById(id);

    if (!company) return null;

    return this.updateCompany(id, {
      accountingApiConfig: {
        ...company.accountingApiConfig,
        ...api
      }
    });
  }
}