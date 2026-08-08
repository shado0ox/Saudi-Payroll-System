import { Response } from 'express';
import { CompanyModel } from '../models/CompanyModel';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class CompanyController {

  static async getCompanies(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const companies = await CompanyModel.getAllCompanies();

      return res.json({
        success: true,
        data: companies
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message
        }
      });
    }
  }


  static async getCompanyById(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const { id } = req.params;

      // المستخدم يرى شركته فقط
      if (req.companyId && id !== req.companyId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access to another company is not allowed.'
          }
        });
      }

      const company = await CompanyModel.getById(id);

      if (!company) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Company not found'
          }
        });
      }

      return res.json({
        success: true,
        data: company
      });

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message
        }
      });
    }
  }


  static async updateCompany(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const { id } = req.params;

      if (req.companyId && id !== req.companyId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot modify another company.'
          }
        });
      }

      const {
        name,
        code,
        crNumber,
        currency,
        chartOfAccounts,
        wpsConfig,
        accountingApiConfig
      } = req.body;

      const company = await CompanyModel.getById(id);

      if (!company) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Company not found'
          }
        });
      }

      const updated = await CompanyModel.updateCompany(id, {
        ...(name !== undefined && { name }),
        ...(code !== undefined && {
          code: String(code).toUpperCase()
        }),
        ...(crNumber !== undefined && { crNumber }),
        ...(currency !== undefined && { currency }),

        ...(chartOfAccounts !== undefined && {
          chartOfAccounts: {
            ...company.chartOfAccounts,
            ...chartOfAccounts
          }
        }),

        ...(wpsConfig !== undefined && {
          wpsConfig: {
            ...company.wpsConfig,
            ...wpsConfig
          }
        }),

        ...(accountingApiConfig !== undefined && {
          accountingApiConfig: {
            ...company.accountingApiConfig,
            ...accountingApiConfig
          }
        })
      });

      return res.json({
        success: true,
        data: updated,
        message: 'Company settings updated successfully.'
      });

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message
        }
      });
    }
  }


  static async createCompany(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const {
        name,
        code,
        crNumber,
        currency,
        chartOfAccounts,
        wpsConfig,
        accountingApiConfig
      } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Company name and code are required.'
          }
        });
      }

      const existing =
        await CompanyModel.getByCode(code);

      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'COMPANY_EXISTS',
            message: 'Company code already exists.'
          }
        });
      }

      const newCompany =
        await CompanyModel.createCompany({
          name,
          code: String(code).toUpperCase(),
          crNumber: crNumber || null,
          currency: currency || 'SAR',
          currencySymbol: 'ر.س',
          chartOfAccounts: chartOfAccounts || {},
          wpsConfig: wpsConfig || {},
          accountingApiConfig:
            accountingApiConfig || {},
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
        error: {
          code: 'SERVER_ERROR',
          message: err.message
        }
      });
    }
  }


  static async testAccountingApi(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const { id } = req.params;

      if (req.companyId && id !== req.companyId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access to another company is not allowed.'
          }
        });
      }

      const company = await CompanyModel.getById(id);

      if (!company) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Company not found'
          }
        });
      }

      const apiConfig: any =
        company.accountingApiConfig || {};

      if (!apiConfig.apiUrl) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ACCOUNTING_API_NOT_CONFIGURED',
            message:
              'Accounting API has not been configured yet.'
          }
        });
      }

      return res.json({
        success: true,
        data: {
          companyId: company.id,
          companyName: company.name,
          endpointConfigured: apiConfig.apiUrl,
          configured: true
        },
        message:
          'Accounting API configuration is available.'
      });

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err.message
        }
      });
    }
  }
}