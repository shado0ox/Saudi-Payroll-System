import { db } from '../database/postgres';
import { AccountingJournalEntry } from '../types';

function mapJournalEntry(row: any): AccountingJournalEntry {
  return {
    id: row.id,
    companyId: row.company_id,
    runId: row.run_id,
    runCode: row.run_code,
    reference: row.reference,
    period: row.period,
    status: row.status,
    retryCount: Number(row.retry_count || 0),
    maxRetries: Number(row.max_retries || 5),
    totalDebit: Number(row.total_debit || 0),
    totalCredit: Number(row.total_credit || 0),
    journalData: row.journal_data,
    lastError: row.last_error || undefined,
    transactionId: row.transaction_id || undefined,
    alertSent: Boolean(row.alert_sent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at || undefined
  } as AccountingJournalEntry;
}

export class JournalEntryModel {

  /**
   * Get all journal entries
   */
  public static async getAll(
    companyId?: string
  ): Promise<AccountingJournalEntry[]> {

    const result = companyId
      ? await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          WHERE company_id = $1
          ORDER BY updated_at DESC
          `,
          [companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          ORDER BY updated_at DESC
          `
        );

    return result.rows.map(mapJournalEntry);
  }

  /**
   * Get journal entry by ID
   */
  public static async getById(
    id: string,
    companyId?: string
  ): Promise<AccountingJournalEntry | undefined> {

    const result = companyId
      ? await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          WHERE id = $1
            AND company_id = $2
          LIMIT 1
          `,
          [id, companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );

    return result.rows[0]
      ? mapJournalEntry(result.rows[0])
      : undefined;
  }

  /**
   * Get journal entry by Payroll Run ID
   */
  public static async getByRunId(
    runId: string,
    companyId?: string
  ): Promise<AccountingJournalEntry | undefined> {

    const result = companyId
      ? await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          WHERE run_id = $1
            AND company_id = $2
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [runId, companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          WHERE run_id = $1
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [runId]
        );

    return result.rows[0]
      ? mapJournalEntry(result.rows[0])
      : undefined;
  }

  /**
   * Save or update journal entry
   */
  public static async save(
    entry: AccountingJournalEntry
  ): Promise<AccountingJournalEntry> {

    if (!entry.companyId) {
      throw new Error(
        'companyId is required when saving accounting journal entry.'
      );
    }

    const result = await db.query(
      `
      INSERT INTO accounting_journal_entries (
        id,
        company_id,
        run_id,
        run_code,
        reference,
        period,
        status,
        retry_count,
        max_retries,
        total_debit,
        total_credit,
        journal_data,
        last_error,
        transaction_id,
        alert_sent,
        created_at,
        updated_at,
        sent_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12::jsonb,$13,$14,$15,
        $16,CURRENT_TIMESTAMP,$17
      )

      ON CONFLICT (id)
      DO UPDATE SET
        company_id = EXCLUDED.company_id,
        run_id = EXCLUDED.run_id,
        run_code = EXCLUDED.run_code,
        reference = EXCLUDED.reference,
        period = EXCLUDED.period,
        status = EXCLUDED.status,
        retry_count = EXCLUDED.retry_count,
        max_retries = EXCLUDED.max_retries,
        total_debit = EXCLUDED.total_debit,
        total_credit = EXCLUDED.total_credit,
        journal_data = EXCLUDED.journal_data,
        last_error = EXCLUDED.last_error,
        transaction_id = EXCLUDED.transaction_id,
        alert_sent = EXCLUDED.alert_sent,
        updated_at = CURRENT_TIMESTAMP,
        sent_at = EXCLUDED.sent_at

      RETURNING *
      `,
      [
        entry.id,
        entry.companyId,
        entry.runId || null,
        entry.runCode,
        entry.reference,
        entry.period,
        entry.status || 'pending',
        entry.retryCount || 0,
        entry.maxRetries || 5,
        entry.totalDebit || 0,
        entry.totalCredit || 0,
        JSON.stringify(entry.journalData || {}),
        entry.lastError || null,
        entry.transactionId || null,
        Boolean(entry.alertSent),
        entry.createdAt || new Date().toISOString(),
        entry.sentAt || null
      ]
    );

    return mapJournalEntry(
      result.rows[0]
    );
  }

  /**
   * Failed entries eligible for retry
   */
  public static async getFailedEntriesForRetry(
    companyId?: string
  ): Promise<AccountingJournalEntry[]> {

    const result = companyId
      ? await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          WHERE status = 'failed'
            AND retry_count < max_retries
            AND company_id = $1
          ORDER BY updated_at ASC
          `,
          [companyId]
        )
      : await db.query(
          `
          SELECT *
          FROM accounting_journal_entries
          WHERE status = 'failed'
            AND retry_count < max_retries
          ORDER BY updated_at ASC
          `
        );

    return result.rows.map(
      mapJournalEntry
    );
  }
}