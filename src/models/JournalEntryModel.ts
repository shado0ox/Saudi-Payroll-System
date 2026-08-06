import { getDatabase, saveDatabase } from './db';
import { AccountingJournalEntry } from '../types';

export class JournalEntryModel {
  /**
   * Get all journal entries
   */
  public static getAll(companyId?: string): AccountingJournalEntry[] {
    const db = getDatabase();
    if (!db.journalEntries) db.journalEntries = [];
    const entries = companyId 
      ? db.journalEntries.filter(j => j.companyId === companyId)
      : db.journalEntries;
    return [...entries].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get journal entry by ID
   */
  public static getById(id: string, companyId?: string): AccountingJournalEntry | undefined {
    const db = getDatabase();
    if (!db.journalEntries) db.journalEntries = [];
    return db.journalEntries.find(j => j.id === id && (!companyId || j.companyId === companyId));
  }

  /**
   * Get journal entry by Payroll Run ID
   */
  public static getByRunId(runId: string, companyId?: string): AccountingJournalEntry | undefined {
    const db = getDatabase();
    if (!db.journalEntries) db.journalEntries = [];
    return db.journalEntries.find(j => j.runId === runId && (!companyId || j.companyId === companyId));
  }

  /**
   * Save or update a journal entry
   */
  public static save(entry: AccountingJournalEntry): AccountingJournalEntry {
    const db = getDatabase();
    if (!db.journalEntries) db.journalEntries = [];
    if (!entry.companyId) entry.companyId = 'comp-101';
    const index = db.journalEntries.findIndex(j => j.id === entry.id);

    entry.updatedAt = new Date().toISOString();

    if (index >= 0) {
      db.journalEntries[index] = entry;
    } else {
      db.journalEntries.unshift(entry);
    }

    saveDatabase(db);
    return entry;
  }

  /**
   * Get all entries with status 'failed' and retryCount < maxRetries
   */
  public static getFailedEntriesForRetry(companyId?: string): AccountingJournalEntry[] {
    const db = getDatabase();
    if (!db.journalEntries) db.journalEntries = [];
    return db.journalEntries.filter(
      j => j.status === 'failed' && j.retryCount < (j.maxRetries || 5) && (!companyId || j.companyId === companyId)
    );
  }
}
