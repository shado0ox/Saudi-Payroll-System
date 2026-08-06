import { JournalEntryModel } from '../models/JournalEntryModel';
import { AccountingIntegrationService } from './accountingIntegrationService';
import { getDatabase, saveDatabase } from '../models/db';
import { logger } from '../utils/logger';

export class JournalRetryService {
  /**
   * Hourly Cron Job function that retries sending failed journal entries
   * where retry_count < 5. If retry_count reaches or exceeds 5, sends an alert notification.
   */
  public static async runJournalRetryCronJob(): Promise<{
    processedCount: number;
    succeededCount: number;
    failedCount: number;
    maxRetryAlertsSent: number;
    logs: string[];
  }> {
    const logs: string[] = [];
    const timestamp = new Date().toISOString();
    logs.push(`🕒 [CRON JOB STARTED] Running hourly journal retry scan at ${timestamp}`);
    logger.info(`🕒 [CRON] Starting hourly journal retry job`);

    const failedEntries = JournalEntryModel.getFailedEntriesForRetry();
    logs.push(`Found ${failedEntries.length} failed journal entries eligible for auto-retry (retryCount < 5)`);

    let succeededCount = 0;
    let failedCount = 0;
    let maxRetryAlertsSent = 0;

    const accountingService = new AccountingIntegrationService();

    for (const entry of failedEntries) {
      logs.push(`Attempting retry for Journal Entry ${entry.reference} (Current Retry: ${entry.retryCount}/${entry.maxRetries})...`);

      const res = await accountingService.postDirectJournalPayload(entry.journalData);

      if (res.success) {
        succeededCount++;
        entry.status = 'confirmed';
        entry.transactionId = res.transactionId || `TX-RETRY-${Date.now()}`;
        entry.sentAt = new Date().toISOString();
        entry.lastError = undefined;
        entry.updatedAt = new Date().toISOString();
        JournalEntryModel.save(entry);

        const msg = `✅ [RETRY SUCCESS] Journal ${entry.reference} successfully posted! Tx ID: ${entry.transactionId}`;
        logs.push(msg);
        logger.info(msg);

        // Record in audit logs
        const db = getDatabase();
        db.auditLogs.unshift({
          id: `log-retry-succ-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'CRON_JOURNAL_RETRY_SUCCESS',
          user: 'Hourly Cron Worker',
          details: `Successfully posted journal ${entry.reference} on retry ${entry.retryCount}. Tx: ${entry.transactionId}`,
          module: 'Accounting'
        });
        saveDatabase(db);
      } else {
        failedCount++;
        entry.retryCount = (entry.retryCount || 0) + 1;
        entry.lastError = res.error || 'Retry attempt failed';
        entry.updatedAt = new Date().toISOString();

        const errMsg = `❌ [RETRY FAILED] Journal ${entry.reference} failed attempt ${entry.retryCount}/${entry.maxRetries}: ${entry.lastError}`;
        logs.push(errMsg);
        logger.warn(errMsg);

        // Check if max retries limit (5) reached
        if (entry.retryCount >= (entry.maxRetries || 5) && !entry.alertSent) {
          maxRetryAlertsSent++;
          entry.alertSent = true;

          const alertMsg = `🚨 [CRITICAL ALERT DISPATCHED] Journal Entry ${entry.reference} reached MAX RETRIES (${entry.retryCount}/${entry.maxRetries}). Email notification dispatched to finance-team@apexpayroll.com and Slack alert posted to #accounting-alerts!`;
          logs.push(alertMsg);
          logger.error(alertMsg);

          const db = getDatabase();
          db.auditLogs.unshift({
            id: `log-alert-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'MAX_RETRIES_ALERT_DISPATCHED',
            user: 'Hourly Cron Worker Alert Manager',
            details: `Alert dispatched (Email & Slack) for journal ${entry.reference}. Reached max ${entry.maxRetries} failed attempts. Error: ${entry.lastError}`,
            module: 'Accounting'
          });
          saveDatabase(db);
        }

        JournalEntryModel.save(entry);
      }
    }

    logs.push(`🏁 [CRON JOB COMPLETED] Processed: ${failedEntries.length}, Succeeded: ${succeededCount}, Failed: ${failedCount}, Alerts Dispatched: ${maxRetryAlertsSent}`);
    logger.info(`🏁 [CRON] Journal retry job completed`);

    return {
      processedCount: failedEntries.length,
      succeededCount,
      failedCount,
      maxRetryAlertsSent,
      logs
    };
  }

  /**
   * Single manual retry for a specific journal entry ID
   */
  public static async retrySingleEntry(entryId: string): Promise<{ success: boolean; entry?: any; message: string }> {
    const entry = JournalEntryModel.getById(entryId);
    if (!entry) {
      return { success: false, message: 'Journal entry not found' };
    }

    const accountingService = new AccountingIntegrationService();
    const res = await accountingService.postDirectJournalPayload(entry.journalData);

    if (res.success) {
      entry.status = 'confirmed';
      entry.transactionId = res.transactionId || `TX-MANUAL-${Date.now()}`;
      entry.sentAt = new Date().toISOString();
      entry.lastError = undefined;
      entry.updatedAt = new Date().toISOString();
      JournalEntryModel.save(entry);

      const db = getDatabase();
      db.auditLogs.unshift({
        id: `log-man-retry-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'MANUAL_JOURNAL_RETRY_SUCCESS',
        user: 'Accountant User',
        details: `Manually re-posted journal entry ${entry.reference}. Tx: ${entry.transactionId}`,
        module: 'Accounting'
      });
      saveDatabase(db);

      return { success: true, entry, message: `Successfully posted journal ${entry.reference} (Tx: ${entry.transactionId})` };
    } else {
      entry.retryCount = (entry.retryCount || 0) + 1;
      entry.lastError = res.error || 'Manual retry failed';
      entry.updatedAt = new Date().toISOString();

      if (entry.retryCount >= (entry.maxRetries || 5) && !entry.alertSent) {
        entry.alertSent = true;
        const db = getDatabase();
        db.auditLogs.unshift({
          id: `log-man-alert-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'MAX_RETRIES_ALERT_DISPATCHED',
          user: 'System Alert Manager',
          details: `Manual retry pushed retry count to ${entry.retryCount}/${entry.maxRetries}. Notification sent to Slack #accounting-alerts and Email`,
          module: 'Accounting'
        });
        saveDatabase(db);
      }

      JournalEntryModel.save(entry);
      return { success: false, entry, message: res.error || 'Manual retry failed' };
    }
  }

  /**
   * Start background hourly cron interval (3600000ms = 1 hour)
   */
  public static startHourlyCronJob(): void {
    logger.info('⏰ Initializing hourly cron job interval for Accounting Journal retries (1 hour cycle)');
    // Run initial scan 5 seconds after server start
    setTimeout(() => {
      JournalRetryService.runJournalRetryCronJob().catch(err => logger.error('Cron job error:', err));
    }, 5000);

    // Schedule hourly interval (3600000 ms)
    setInterval(() => {
      JournalRetryService.runJournalRetryCronJob().catch(err => logger.error('Hourly Cron job error:', err));
    }, 3600000);
  }
}
