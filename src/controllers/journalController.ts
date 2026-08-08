import { Response } from 'express';

import { JournalEntryModel } from '../models/JournalEntryModel';
import { JournalRetryService } from '../services/journalRetryService';
import { PayrollModel } from '../models/PayrollModel';
import { SettingsModel } from '../models/SettingsModel';

import { AccountingIntegrationService } from '../services/accountingIntegrationService';

import { AuthenticatedRequest } from '../middlewares/authMiddleware';


export class JournalController {

  /**
   * GET /api/payroll/journals
   *
   * Query:
   * ?status=all|pending|sent|confirmed|failed
   * &search=KEYWORD
   */
  public static async getEntries(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {

    try {

      const companyId =
        req.companyId;

      if (!companyId) {

        res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });

        return;
      }


      const {
        status,
        search
      } = req.query;


      let entries =
        await JournalEntryModel.getAll(
          companyId
        );


      /*
       * Stats before UI filtering.
       */
      const stats = {

        total:
          entries.length,

        pending:
          entries.filter(
            entry =>
              entry.status === 'pending'
          ).length,

        sent:
          entries.filter(
            entry =>
              entry.status === 'sent'
          ).length,

        confirmed:
          entries.filter(
            entry =>
              entry.status === 'confirmed'
          ).length,

        failed:
          entries.filter(
            entry =>
              entry.status === 'failed'
          ).length,

        maxRetryExceededAlerts:
          entries.filter(
            entry =>
              entry.retryCount >=
              (entry.maxRetries || 5)
          ).length
      };


      /*
       * Status filter.
       */
      if (
        status &&
        status !== 'all' &&
        typeof status === 'string'
      ) {

        entries =
          entries.filter(
            entry =>
              entry.status === status
          );
      }


      /*
       * Search filter.
       */
      if (
        search &&
        typeof search === 'string' &&
        search.trim() !== ''
      ) {

        const query =
          search
            .toLowerCase()
            .trim();


        entries =
          entries.filter(
            entry =>

              entry.reference
                .toLowerCase()
                .includes(query) ||

              entry.runCode
                .toLowerCase()
                .includes(query) ||

              entry.period
                .toLowerCase()
                .includes(query) ||

              (
                entry.lastError &&
                entry.lastError
                  .toLowerCase()
                  .includes(query)
              )
          );
      }


      res.json({
        success: true,
        stats,
        data: entries
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            err.message ||
            'Error fetching journal entries.'
        }
      });
    }
  }


  /**
   * GET /api/payroll/journals/:id
   */
  public static async getEntryById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {

    try {

      const companyId =
        req.companyId;

      if (!companyId) {

        res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });

        return;
      }


      const { id } =
        req.params;


      const entry =
        await JournalEntryModel.getById(
          id,
          companyId
        );


      if (!entry) {

        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message:
              'Journal entry not found.'
          }
        });

        return;
      }


      res.json({
        success: true,
        data: entry
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            err.message ||
            'Error fetching journal entry.'
        }
      });
    }
  }


  /**
   * POST /api/payroll/journals/:id/retry
   *
   * Manual retry.
   */
  public static async retryEntry(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {

    try {

      const companyId =
        req.companyId;

      if (!companyId) {

        res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });

        return;
      }


      const { id } =
        req.params;


      const userName =
        req.user
          ? (
              `${req.user.firstName || ''} ${req.user.lastName || ''}`
                .trim() ||
              req.user.username
            )
          : 'System User';


      const result =
        await JournalRetryService.retrySingleEntry(
          id,
          companyId,
          userName
        );


      res
        .status(
          result.success
            ? 200
            : 400
        )
        .json({
          success:
            result.success,

          message:
            result.message,

          data:
            result.entry
        });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            err.message ||
            'Manual retry failed.'
        }
      });
    }
  }


  /**
   * POST /api/payroll/journals/trigger-cron
   *
   * Manually execute retry scan.
   */
  public static async triggerCron(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {

    try {

      if (!req.companyId) {

        res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });

        return;
      }


      const result =
        await JournalRetryService
          .runJournalRetryCronJob();


      res.json({
        success: true,

        message:
          `Journal retry scan completed. ` +
          `Processed ${result.processedCount}, ` +
          `${result.succeededCount} succeeded, ` +
          `${result.failedCount} failed, ` +
          `${result.maxRetryAlertsSent} max-retry alerts recorded.`,

        data: result
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            err.message ||
            'Error executing journal retry job.'
        }
      });
    }
  }


  /**
   * POST /api/payroll/journals/sync-run/:runId
   *
   * Create/update and send accounting
   * journal for a payroll run.
   */
  public static async syncRunJournal(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {

    try {

      const companyId =
        req.companyId;

      if (!companyId) {

        res.status(401).json({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Active company is required.'
          }
        });

        return;
      }


      const { runId } =
        req.params;


      /*
       * Company scoped Payroll Run.
       */
      const run =
        await PayrollModel.getRunById(
          runId,
          companyId
        );


      if (!run) {

        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message:
              'Payroll run not found.'
          }
        });

        return;
      }


      /*
       * PostgreSQL company settings.
       *
       * No JSON database.
       */
      const config =
        await SettingsModel.getConfig(
          companyId
        );


      const integrationService =
        new AccountingIntegrationService();


      const journalPayload =
        integrationService
          .generateJournalEntry(
            run,
            config
          );


      /*
       * Get existing journal
       * for same company/run.
       */
      let existing =
        await JournalEntryModel
          .getByRunId(
            run.id,
            companyId
          );


      /*
       * Create new journal when absent.
       */
      if (!existing) {

        const now =
          new Date().toISOString();


        existing = {

          id:
            `je-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 7)}`,

          companyId,

          runId:
            run.id,

          runCode:
            run.runCode,

          reference:
            run.runCode,

          period:
            run.period,

          status:
            'pending',

          retryCount:
            0,

          maxRetries:
            5,

          totalDebit:
            run.totalGrossPay +
            run.totalEmployerContributions,

          totalCredit:
            run.totalNetPay +
            run.totalDeductions +
            run.totalEmployerContributions,

          journalData:
            journalPayload,

          createdAt:
            now,

          updatedAt:
            now
        };

      } else {

        /*
         * Refresh journal amounts/payload
         * in case the payroll calculation
         * changed before re-sync.
         */
        existing.runCode =
          run.runCode;

        existing.reference =
          run.runCode;

        existing.period =
          run.period;

        existing.totalDebit =
          run.totalGrossPay +
          run.totalEmployerContributions;

        existing.totalCredit =
          run.totalNetPay +
          run.totalDeductions +
          run.totalEmployerContributions;

        existing.journalData =
          journalPayload;

        existing.updatedAt =
          new Date().toISOString();
      }


      /*
       * Send to accounting integration.
       */
      const sendResult =
        await integrationService
          .postDirectJournalPayload(
            journalPayload
          );


      if (sendResult.success) {

        existing.status =
          'confirmed';

        existing.transactionId =
          sendResult.transactionId ||
          `TX-${Date.now()}`;

        existing.sentAt =
          new Date().toISOString();

        existing.lastError =
          undefined;

      } else {

        existing.status =
          'failed';

        existing.retryCount =
          (existing.retryCount || 0) + 1;

        existing.lastError =
          sendResult.error ||
          'Accounting journal posting failed.';
      }


      existing.updatedAt =
        new Date().toISOString();


      const savedEntry =
        await JournalEntryModel.save(
          existing
        );


      res.json({

        success:
          sendResult.success,

        message:
          sendResult.success
            ? 'Journal synced and posted successfully.'
            : 'Journal saved, but posting to accounting system failed.',

        data:
          savedEntry
      });

    } catch (err: any) {

      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            err.message ||
            'Error syncing payroll journal.'
        }
      });
    }
  }
}