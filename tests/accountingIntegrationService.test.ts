import nock from 'nock';
import { AccountingIntegrationService } from '../src/services/accountingIntegrationService';
import { PayrollRun, SystemConfig } from '../src/types';

describe('AccountingIntegrationService Integration Tests with Nock', () => {
  const API_HOST = 'https://api.accounting-system.local';
  const API_PATH = '/v1/journals';

  const sampleConfig: SystemConfig = {
    companyName: 'Apex Saudi Tech',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    standardMonthlyWorkDays: 30,
    overtimeHourlyMultiplier: 1.5,
    socialSecurityEmployeeRate: 0.10,
    socialSecurityEmployerRate: 0.12,
    taxBrackets: [],
    autoProcessSchedule: '0 0 25 * *',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const sampleRun: PayrollRun = {
    id: 'pr-2026-08',
    companyId: 'comp-101',
    runCode: 'PAY-202608',
    title: 'Monthly Payroll August 2026',
    period: '2026-08',
    status: 'approved',
    totalEmployees: 5,
    totalGrossPay: 77500,
    totalDeductions: 7750,
    totalEmployerContributions: 9300,
    totalNetPay: 69750,
    payslips: [],
    createdAt: '2026-08-01T10:00:00Z'
  };

  afterEach(() => {
    nock.cleanAll();
  });

  test('تنسيق القيد المحاسبي المزدوج بشكل صحيح (Double-entry Journal Payload formatting)', () => {
    const service = new AccountingIntegrationService(`${API_HOST}${API_PATH}`);
    const journalPayload = service.generateJournalEntry(sampleRun, sampleConfig);

    expect(journalPayload.reference).toBe('PAY-202608');
    expect(journalPayload.currency).toBe('SAR');
    expect(journalPayload.lines.length).toBe(4);

    const debitSum = journalPayload.lines
      .filter(l => l.type === 'debit')
      .reduce((sum, l) => sum + l.amount, 0);

    const creditSum = journalPayload.lines
      .filter(l => l.type === 'credit')
      .reduce((sum, l) => sum + l.amount, 0);

    // Accounting Principle: Total Debits == Total Credits
    expect(debitSum).toBe(77500 + 9300); // 86800
    expect(creditSum).toBe(69750 + 17050); // 86800
    expect(debitSum).toEqual(creditSum);
  });

  test('نجاح التترحيل المحاسبي عبر API (Successful API response 200 OK)', async () => {
    nock(API_HOST)
      .post(API_PATH)
      .reply(200, { success: true, transactionId: 'TX-ACC-998877' });

    const service = new AccountingIntegrationService(`${API_HOST}${API_PATH}`);
    const result = await service.postPayrollJournal(sampleRun, sampleConfig);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('TX-ACC-998877');
  });

  test('فشل التترحيل عند خطأ الخادم (API Error 400 Bad Request)', async () => {
    nock(API_HOST)
      .post(API_PATH)
      .reply(400, { error: 'INVALID_ACCOUNT_CODE', message: 'Account code 5101 does not exist' });

    const service = new AccountingIntegrationService(`${API_HOST}${API_PATH}`, 3, 1000);
    const result = await service.postPayrollJournal(sampleRun, sampleConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Accounting API Error (400)');
  });

  test('التعامل مع مهلة الانتخاب Timeout وإعادة المحاولة Retry بنجاح (Timeout with Retry)', async () => {
    // Attempt 1: Timeout (delay response past limit)
    nock(API_HOST)
      .post(API_PATH)
      .delayConnection(500)
      .reply(200, { transactionId: 'TX-DELAYED' });

    // Attempt 2: Immediate Success
    nock(API_HOST)
      .post(API_PATH)
      .reply(200, { transactionId: 'TX-RETRY-SUCCESS' });

    // Service configured with short timeout of 200ms
    const service = new AccountingIntegrationService(`${API_HOST}${API_PATH}`, 3, 200);
    const result = await service.postPayrollJournal(sampleRun, sampleConfig);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('TX-RETRY-SUCCESS');
  });
});
