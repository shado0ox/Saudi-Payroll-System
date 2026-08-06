import { getDatabase, saveDatabase } from './db';
import { Company, CompanyChartOfAccounts, CompanyWpsConfig, CompanyAccountingApiConfig } from '../types';

export class CompanyModel {
  static getAllCompanies(): Company[] {
    const db = getDatabase();
    return db.companies || [];
  }

  static getById(id: string): Company | undefined {
    const db = getDatabase();
    return (db.companies || []).find(c => c.id === id);
  }

  static getByCode(code: string): Company | undefined {
    const db = getDatabase();
    return (db.companies || []).find(c => c.code.toUpperCase() === code.toUpperCase());
  }

  static createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company {
    const db = getDatabase();
    if (!db.companies) db.companies = [];
    const now = new Date().toISOString();
    const newCompany: Company = {
      ...data,
      id: `comp-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    db.companies.push(newCompany);
    saveDatabase(db);
    return newCompany;
  }

  static updateCompany(id: string, updates: Partial<Company>): Company | null {
    const db = getDatabase();
    if (!db.companies) db.companies = [];
    const idx = db.companies.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const updated: Company = {
      ...db.companies[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    db.companies[idx] = updated;
    saveDatabase(db);
    return updated;
  }

  static updateChartOfAccounts(id: string, coa: Partial<CompanyChartOfAccounts>): Company | null {
    const company = this.getById(id);
    if (!company) return null;
    const updatedCoa: CompanyChartOfAccounts = {
      ...company.chartOfAccounts,
      ...coa
    };
    return this.updateCompany(id, { chartOfAccounts: updatedCoa });
  }

  static updateWpsConfig(id: string, wps: Partial<CompanyWpsConfig>): Company | null {
    const company = this.getById(id);
    if (!company) return null;
    const updatedWps: CompanyWpsConfig = {
      ...company.wpsConfig,
      ...wps
    };
    return this.updateCompany(id, { wpsConfig: updatedWps });
  }

  static updateAccountingApiConfig(id: string, api: Partial<CompanyAccountingApiConfig>): Company | null {
    const company = this.getById(id);
    if (!company) return null;
    const updatedApi: CompanyAccountingApiConfig = {
      ...company.accountingApiConfig,
      ...api
    };
    return this.updateCompany(id, { accountingApiConfig: updatedApi });
  }
}
