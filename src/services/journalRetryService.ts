import { JournalEntryModel } from '../models/JournalEntryModel';
import { AccountingIntegrationService } from './accountingIntegrationService';
import { db } from '../database/postgres';
import { logger } from '../utils/logger';

export class JournalRetryService {

  /**
   * Write audit log directly to PostgreSQL.
   */
  private static async writeAuditLog(
    companyId: string,
    action: string,
    userName: string,
    details: string,
    module: string = 'Accounting'
  ): Promise<void> {

    await db.query(
      `
      INSERT INTO audit_logs (
        id,
        company_id,
        timestamp,
        action,
        user_name,
        details,
        module
      )
      VALUES (
        $1,
        $2,
        CURRENT_TIMESTAMP,
        $3,
        $4,
        $5,
        $6
      )
      `,
      [
        `log-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`,
        companyId,
        action,
        userName,
        details,
        module
      ]
    );
  }


  /**
   * Hourly job:
   * Retry failed journal entries while retryCount < maxRetries.
   */
  public static async runJournalRetryCronJob(): Promise<{
    processedCount: number;
    succeededCount: number;
    failedCount: number;
    maxRetryAlertsSent: number;
    logs: string[];
  }> {

    const logs: string[] = [];

    const timestamp =
      new Date().toISOString();

    logs.push(
      `🕒 [CRON JOB STARTED] Running journal retry scan at ${timestamp}`
    );

    logger.info(
      '🕒 [CRON] Starting journal retry job'
    );


    /*
     * PostgreSQL:
     * returns failed entries from all companies.
     */
    const failedEntries =
      await JournalEntryModel
        .getFailedEntriesForRetry();


    logs.push(
      `Found ${failedEntries.length} failed journal entries eligible for retry.`
    );


    let succeededCount = 0;
    let failedCount = 0;
    let maxRetryAlertsSent = 0;


    const accountingService =
      new AccountingIntegrationService();


    for (const entry of failedEntries) {

      /*
       * Skip malformed old records.
       */
      if (!entry.companyId) {

        const warning =
          `⚠️ Journal ${entry.id} skipped because companyId is missing.`;

        logs.push(warning);
        logger.warn(warning);

        continue;
      }


      logs.push(
        `Retrying Journal ${entry.reference} (${entry.retryCount}/${entry.maxRetries})`
      );


      try {

        const result =
          await accountingService
            .postDirectJournalPayload(
              entry.journalData
            );


        /*
         * =============================
         * SUCCESS
         * =============================
         */
        if (result.success) {

          succeededCount++;

          entry.status =
            'confirmed';

          entry.transactionId =
            result.transactionId ||
            `TX-RETRY-${Date.now()}`;

          entry.sentAt =
            new Date().toISOString();

          entry.lastError =
            undefined;

          entry.updatedAt =
            new Date().toISOString();


          await JournalEntryModel.save(
            entry
          );


          const successMessage =
            `✅ Journal ${entry.reference} successfully posted. Transaction: ${entry.transactionId}`;

          logs.push(successMessage);

          logger.info(
            successMessage
          );


          await this.writeAuditLog(
            entry.companyId,
            'CRON_JOURNAL_RETRY_SUCCESS',
            'Journal Retry Worker',
            `Successfully posted journal ${entry.reference}. Retry count: ${entry.retryCount}. Transaction: ${entry.transactionId}`
          );


          continue;
        }


        /*
         * =============================
         * FAILED
         * =============================
         */

        failedCount++;

        entry.status =
          'failed';

        entry.retryCount =
          (entry.retryCount || 0) + 1;

        entry.lastError =
          result.error ||
          'Journal retry failed';

        entry.updatedAt =
          new Date().toISOString();


        const failureMessage =
          `❌ Journal ${entry.reference} retry failed (${entry.retryCount}/${entry.maxRetries}): ${entry.lastError}`;

        logs.push(
          failureMessage
        );

        logger.warn(
          failureMessage
        );


        /*
         * Maximum retry threshold reached.
         */
        if (
          entry.retryCount >=
            (entry.maxRetries || 5) &&
          !entry.alertSent
        ) {

          entry.alertSent =
            true;

          maxRetryAlertsSent++;


          const alertMessage =
            `🚨 Journal ${entry.reference} reached maximum retry attempts (${entry.retryCount}/${entry.maxRetries}).`;

          logs.push(
            alertMessage
          );

          logger.error(
            alertMessage
          );


          /*
           * We record the alert in PostgreSQL.
           * No fake Email/Slack notification.
           */
          await this.writeAuditLog(
            entry.companyId,
            'MAX_RETRIES_ALERT_RECORDED',
            'Journal Retry Worker',
            `Journal ${entry.reference} reached maximum retries (${entry.retryCount}/${entry.maxRetries}). Last error: ${entry.lastError}`
          );
        }


        await JournalEntryModel.save(
          entry
        );

      } catch (error: any) {

        /*
         * Unexpected integration exception.
         */
        failedCount++;

        entry.status =
          'failed';

        entry.retryCount =
          (entry.retryCount || 0) + 1;

        entry.lastError =
          error?.message ||
          'Unexpected journal retry error';

        entry.updatedAt =
          new Date().toISOString();


        if (
          entry.retryCount >=
            (entry.maxRetries || 5) &&
          !entry.alertSent
        ) {

          entry.alertSent =
            true;

          maxRetryAlertsSent++;


          await this.writeAuditLog(
            entry.companyId,
            'MAX_RETRIES_ALERT_RECORDED',
            'Journal Retry Worker',
            `Journal ${entry.reference} reached maximum retries after an unexpected error. Error: ${entry.lastError}`
          );
        }


        await JournalEntryModel.save(
          entry
        );


        const unexpectedMessage =
          `❌ Unexpected retry error for ${entry.reference}: ${entry.lastError}`;

        logs.push(
          unexpectedMessage
        );

        logger.error(
          unexpectedMessage
        );
      }
    }


    const completedMessage =
      `🏁 [CRON COMPLETED] Processed: ${failedEntries.length}, Succeeded: ${succeededCount}, Failed: ${failedCount}, Max Retry Alerts: ${maxRetryAlertsSent}`;

    logs.push(
      completedMessage
    );

    logger.info(
      completedMessage
    );


    return {
      processedCount:
        failedEntries.length,

      succeededCount,

      failedCount,

      maxRetryAlertsSent,

      logs
    };
  }


  /**
   * Manual retry for a journal entry.
   *
   * companyId is optional for backwards compatibility,
   * but controllers should pass it for tenant isolation.
   */
  public static async retrySingleEntry(
    entryId: string,
    companyId?: string,
    userName: string = 'Accountant User'
  ): Promise<{
    success: boolean;
    entry?: any;
    message: string;
  }> {

    const entry =
      await JournalEntryModel.getById(
        entryId,
        companyId
      );


    if (!entry) {

      return {
        success: false,
        message:
          'Journal entry not found.'
      };
    }


    if (!entry.companyId) {

      return {
        success: false,
        message:
          'Journal entry has no company assigned.'
      };
    }


    const accountingService =
      new AccountingIntegrationService();


    try {

      const result =
        await accountingService
          .postDirectJournalPayload(
            entry.journalData
          );


      /*
       * =============================
       * MANUAL RETRY SUCCESS
       * =============================
       */
      if (result.success) {

        entry.status =
          'confirmed';

        entry.transactionId =
          result.transactionId ||
          `TX-MANUAL-${Date.now()}`;

        entry.sentAt =
          new Date().toISOString();

        entry.lastError =
          undefined;

        entry.updatedAt =
          new Date().toISOString();


        const saved =
          await JournalEntryModel.save(
            entry
          );


        await this.writeAuditLog(
          entry.companyId,
          'MANUAL_JOURNAL_RETRY_SUCCESS',
          userName,
          `Manually posted journal ${entry.reference}. Transaction: ${entry.transactionId}`
        );


        return {
          success: true,
          entry: saved,
          message:
            `Successfully posted journal ${entry.reference}.`
        };
      }


      /*
       * =============================
       * MANUAL RETRY FAILED
       * =============================
       */

      entry.status =
        'failed';

      entry.retryCount =
        (entry.retryCount || 0) + 1;

      entry.lastError =
        result.error ||
        'Manual retry failed';

      entry.updatedAt =
        new Date().toISOString();


      if (
        entry.retryCount >=
          (entry.maxRetries || 5) &&
        !entry.alertSent
      ) {

        entry.alertSent =
          true;


        await this.writeAuditLog(
          entry.companyId,
          'MAX_RETRIES_ALERT_RECORDED',
          userName,
          `Manual retry caused journal ${entry.reference} to reach maximum retries (${entry.retryCount}/${entry.maxRetries}). Last error: ${entry.lastError}`
        );
      }


      const saved =
        await JournalEntryModel.save(
          entry
        );


      return {
        success: false,
        entry: saved,
        message:
          entry.lastError ||
          'Manual retry failed.'
      };

    } catch (error: any) {

      entry.status =
        'failed';

      entry.retryCount =
        (entry.retryCount || 0) + 1;

      entry.lastError =
        error?.message ||
        'Unexpected manual retry error';

      entry.updatedAt =
        new Date().toISOString();


      if (
        entry.retryCount >=
          (entry.maxRetries || 5) &&
        !entry.alertSent
      ) {

        entry.alertSent =
          true;


        await this.writeAuditLog(
          entry.companyId,
          'MAX_RETRIES_ALERT_RECORDED',
          userName,
          `Journal ${entry.reference} reached maximum retries. Error: ${entry.lastError}`
        );
      }


      const saved =
        await JournalEntryModel.save(
          entry
        );


      logger.error(
        `Manual journal retry failed for ${entry.reference}:`,
        error
      );


      return {
        success: false,
        entry: saved,
        message:
          entry.lastError
      };
    }
  }


  /**
   * Start hourly scheduler.
   */
  public static startHourlyCronJob(): void {

    logger.info(
      '⏰ Initializing Accounting Journal retry scheduler (1 hour cycle)'
    );


    /*
     * First scan shortly after server starts.
     */
    setTimeout(() => {

      JournalRetryService
        .runJournalRetryCronJob()
        .catch(error => {

          logger.error(
            'Initial journal retry job failed:',
            error
          );

        });

    }, 5000);


    /*
     * Every hour.
     */
    setInterval(() => {

      JournalRetryService
        .runJournalRetryCronJob()
        .catch(error => {

          logger.error(
            'Hourly journal retry job failed:',
            error
          );

        });

    }, 3600000);
  }
}