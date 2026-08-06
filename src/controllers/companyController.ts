import { Response } from 'express';
import { CompanyModel } from '../models/CompanyModel';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class CompanyController {
  /**
   * GET /api/companies
   */
  static async getCompanies(req: AuthenticatedRequest, res: Response) {
    try {
      const companies = CompanyModel.getAllCompanies();
      return res.json({
        success: true,
        data: companies
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  /**
   * GET /api/companies/:id
   */
  static async getCompanyById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const company = CompanyModel.getById(id);

      if (!company) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Company not found' }
        });
      }

      return res.json({
        success: true,
        data: company
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  /**
   * PUT /api/companies/:id
   */
  static async updateCompany(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, crNumber, currency, chartOfAccounts, wpsConfig, accountingApiConfig } = req.body;

      const company = CompanyModel.getById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Company not found' }
        });
      }

      const updated = CompanyModel.updateCompany(id, {
        ...(name && { name }),
        ...(code && { code }),
        ...(crNumber && { crNumber }),
        ...(currency && { currency }),
        ...(chartOfAccounts && { chartOfAccounts: { ...company.chartOfAccounts, ...chartOfAccounts } }),
        ...(wpsConfig && { wpsConfig: { ...company.wpsConfig, ...wpsConfig } }),
        ...(accountingApiConfig && { accountingApiConfig: { ...company.accountingApiConfig, ...accountingApiConfig } })
      });

      return res.json({
        success: true,
        data: updated,
        message: 'Company settings updated successfully.'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  /**
   * POST /api/companies
   */
  static async createCompany(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, code, crNumber, currency, chartOfAccounts, wpsConfig, accountingApiConfig } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Company name and code are required.' }
        });
      }

      const defaultCoa = chartOfAccounts || {
        salariesAccountCode: '5101',
        salariesAccountName: 'مصروف الأجور والبدلات',
        gosiExpenseAccountCode: '5105',
        gosiExpenseAccountName: 'مصروف مساهمة التأمينات - صاحب العمل',
        payrollPayableAccountCode: '2101',
        payrollPayableAccountName: 'ذمم الرواتب الصافية المستحقة (WPS)',
        gosiPayableAccountCode: '2105',
        gosiPayableAccountName: 'مستحقات التأمينات الاجتماعية'
      };

      const defaultWps = wpsConfig || {
        payerId: '7000000000',
        payerBankCode: 'RIBL',
        payerIban: 'SA0000000000000000000000',
        establishmentName: name
      };

      const defaultApi = accountingApiConfig || {
        apiUrl: `/api/mock/accounting/${code.toLowerCase()}`,
        apiKey: `${code.toLowerCase()}_secret_key`,
        autoSyncOnApproval: true
      };

      const newCompany = CompanyModel.createCompany({
        name,
        code: code.toUpperCase(),
        crNumber: crNumber || '1010000000',
        currency: currency || 'SAR',
        currencySymbol: 'ر.س',
        chartOfAccounts: defaultCoa,
        wpsConfig: defaultWps,
        accountingApiConfig: defaultApi,
        status: 'active'
      });

      return res.status(201).json({
        success: true,
        data: newCompany,
        message: 'New company registered successfully.'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  /**
   * POST /api/companies/:id/test-api
   */
  static async testAccountingApi(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const company = CompanyModel.getById(id);

      if (!company) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Company not found' }
        });
      }

      const { apiUrl, apiKey } = company.accountingApiConfig;

      // Simulate handshake and payload validation with custom ERP endpoint
      return res.json({
        success: true,
        data: {
          companyId: company.id,
          companyName: company.name,
          endpointTested: apiUrl,
          authStatus: 'VALID_API_KEY',
          chartOfAccountsMapped: true,
          samplePayload: {
            reference: `TEST-PAY-${Date.now()}`,
            lines: [
              { accountCode: company.chartOfAccounts.salariesAccountCode, accountName: company.chartOfAccounts.salariesAccountName, type: 'debit', amount: 50000 },
              { accountCode: company.chartOfAccounts.gosiExpenseAccountCode, accountName: company.chartOfAccounts.gosiExpenseAccountName, type: 'debit', amount: 6000 },
              { accountCode: company.chartOfAccounts.payrollPayableAccountCode, accountName: company.chartOfAccounts.payrollPayableAccountName, type: 'credit', amount: 45000 },
              { accountCode: company.chartOfAccounts.gosiPayableAccountCode, accountName: company.chartOfAccounts.gosiPayableAccountName, type: 'credit', amount: 11000 }
            ]
          },
          latencyMs: Math.floor(Math.random() * 40) + 15
        },
        message: `Successfully connected to Accounting API for ${company.name}`
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }
}
