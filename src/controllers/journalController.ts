import { Response } from 'express';
import { JournalEntryModel } from '../models/JournalEntryModel';
import { JournalRetryService } from '../services/journalRetryService';
import { PayrollModel } from '../models/PayrollModel';
import { AccountingIntegrationService } from '../services/accountingIntegrationService';
import { getDatabase } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class JournalController {
  /**
   * GET /api/payroll/journals
   * Query params: ?status=all|pending|sent|confirmed|failed&search=KEYWORD
   */
  public static async getEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, search } = req.query;
      const companyId = req.companyId;
      let entries = JournalEntryModel.getAll(companyId);

      // Summary counts before filtering
      const stats = {
        total: entries.length,
        pending: entries.filter(e => e.status === 'pending').length,
        sent: entries.filter(e => e.status === 'sent').length,
        confirmed: entries.filter(e => e.status === 'confirmed').length,
        failed: entries.filter(e => e.status === 'failed').length,
        maxRetryExceededAlerts: entries.filter(e => e.retryCount >= 5).length
      };

      if (status && status !== 'all') {
        entries = entries.filter(e => e.status === status);
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        entries = entries.filter(
          e =>
            e.reference.toLowerCase().includes(query) ||
            e.runCode.toLowerCase().includes(query) ||
            e.period.includes(query) ||
            (e.lastError && e.lastError.toLowerCase().includes(query))
        );
      }

      res.json({
        success: true,
        stats,
        data: entries
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error fetching journal entries' });
    }
  }

  /**
   * GET /api/payroll/journals/:id
   */
  public static async getEntryById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId;
      const entry = JournalEntryModel.getById(id, companyId);
      if (!entry) {
        res.status(404).json({ success: false, message: 'Journal entry not found' });
        return;
      }
      res.json({ success: true, data: entry });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error fetching journal entry' });
    }
  }

  /**
   * POST /api/payroll/journals/:id/retry
   * Manually retry sending a specific failed journal entry
   */
  public static async retryEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await JournalRetryService.retrySingleEntry(id);
      res.json({
        success: result.success,
        message: result.message,
        data: result.entry
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Manual retry failed' });
    }
  }

  /**
   * POST /api/payroll/journals/trigger-cron
   * Manually triggers the hourly background retry cron job immediately
   */
  public static async triggerCron(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await JournalRetryService.runJournalRetryCronJob();
      res.json({
        success: true,
        message: `Cron Job executed successfully. Processed ${result.processedCount} entries (${result.succeededCount} succeeded, ${result.failedCount} failed, ${result.maxRetryAlertsSent} alerts sent).`,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error executing cron job' });
    }
  }

  /**
   * POST /api/payroll/journals/sync-run/:runId
   * Creates or updates double-entry journal for a specific payroll run
   */
  public static async syncRunJournal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const companyId = req.companyId;
      const run = PayrollModel.getRunById(runId, companyId);
      if (!run) {
        res.status(404).json({ success: false, message: 'Payroll run not found' });
        return;
      }

      const db = getDatabase();
      const config = db.config;
      const integrationService = new AccountingIntegrationService();
      const journalPayload = integrationService.generateJournalEntry(run, config);

      let existing = JournalEntryModel.getByRunId(runId, companyId);
      if (!existing) {
        existing = {
          id: `je-${Date.now()}`,
          companyId: run.companyId || companyId || 'comp-101',
          runId: run.id,
          runCode: run.runCode,
          reference: run.runCode,
          period: run.period,
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          totalDebit: run.totalGrossPay + run.totalEmployerContributions,
          totalCredit: run.totalNetPay + run.totalDeductions + run.totalEmployerContributions,
          journalData: journalPayload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Try sending
      const sendRes = await integrationService.postDirectJournalPayload(journalPayload);
      if (sendRes.success) {
        existing.status = 'confirmed';
        existing.transactionId = sendRes.transactionId;
        existing.sentAt = new Date().toISOString();
        existing.lastError = undefined;
      } else {
        existing.status = 'failed';
        existing.retryCount = (existing.retryCount || 0) + 1;
        existing.lastError = sendRes.error;
      }

      JournalEntryModel.save(existing);

      res.json({
        success: true,
        message: sendRes.success ? 'Journal synced and posted successfully' : 'Journal created but posting failed',
        data: existing
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error syncing journal' });
    }
  }
}
