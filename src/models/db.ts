import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Employee, AttendanceRecord, PayrollRun, Department, SystemConfig, AuditLog, User, Role, AccountingJournalEntry, Company } from '../types';
import { defaultConfig } from '../config';
import { encryptField } from '../utils/cryptoHelper';

export interface DatabaseSchema {
  config: SystemConfig;
  companies: Company[];
  roles: Role[];
  users: User[];
  departments: Department[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  payrollRuns: PayrollRun[];
  auditLogs: AuditLog[];
  journalEntries: AccountingJournalEntry[];
}

const DB_FILE = path.join(process.cwd(), 'payroll_db.json');

const initialCompanies: Company[] = [
  {
    id: 'comp-101',
    code: 'APEX',
    name: 'شركة أريكس للحلول البرمجية (Apex Tech Solutions)',
    crNumber: '1010892341',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    chartOfAccounts: {
      salariesAccountCode: '5101',
      salariesAccountName: 'مصروف الأجور والبدلات (Salaries & Allowances)',
      gosiExpenseAccountCode: '5105',
      gosiExpenseAccountName: 'مصروف مساهمة التأمينات - صاحب العمل (Employer GOSI)',
      payrollPayableAccountCode: '2101',
      payrollPayableAccountName: 'ذمم الرواتب الصافية المستحقة - WPS (Net Payroll)',
      gosiPayableAccountCode: '2105',
      gosiPayableAccountName: 'مستحقات التأمينات الاجتماعية (GOSI Payable)'
    },
    wpsConfig: {
      payerId: '7001829301',
      payerBankCode: 'RIBL',
      payerIban: 'SA4420000001010892341001',
      establishmentName: 'شركة أريكس للحلول البرمجية'
    },
    accountingApiConfig: {
      apiUrl: '/api/mock/accounting/apex',
      apiKey: 'apex_secret_key_prod_991',
      autoSyncOnApproval: true
    },
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z'
  },
  {
    id: 'comp-102',
    code: 'FANAR',
    name: 'مجموعة الفنار التجارية (Al-Fanar Trading Group)',
    crNumber: '1010994821',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    chartOfAccounts: {
      salariesAccountCode: '5201',
      salariesAccountName: 'تكلفة أجور موظفي المجموعة (Group Employee Wages)',
      gosiExpenseAccountCode: '5205',
      gosiExpenseAccountName: 'حصة التأمينات الاجتماعية لشركة الفنار',
      payrollPayableAccountCode: '2201',
      payrollPayableAccountName: 'حساب مستحقات رواتب البنوك (Bank Payroll Payable)',
      gosiPayableAccountCode: '2205',
      gosiPayableAccountName: 'التزامات المؤسسة العامة للتأمينات'
    },
    wpsConfig: {
      payerId: '7002934812',
      payerBankCode: 'SABB',
      payerIban: 'SA1250000001010994821002',
      establishmentName: 'مجموعة الفنار التجارية'
    },
    accountingApiConfig: {
      apiUrl: '/api/mock/accounting/fanar',
      apiKey: 'fanar_erp_key_live_442',
      autoSyncOnApproval: true
    },
    status: 'active',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z'
  }
];

// Pre-seeded roles
const initialRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'admin',
    displayName: 'System Administrator',
    description: 'Full system access to all resources, user management, and configuration settings.',
    permissions: ['*']
  },
  {
    id: 'role-hr-manager',
    name: 'hr_manager',
    displayName: 'HR Manager',
    description: 'Manage employees, attendance, and view payroll calculations.',
    permissions: ['employees:read', 'employees:write', 'attendance:read', 'attendance:write', 'payroll:read', 'reports:read']
  },
  {
    id: 'role-accountant',
    name: 'accountant',
    displayName: 'Finance Accountant',
    description: 'Process payroll runs, approve batches, generate payslips and WPS export files.',
    permissions: ['payroll:read', 'payroll:write', 'payroll:approve', 'attendance:read', 'reports:read', 'reports:export']
  },
  {
    id: 'role-viewer',
    name: 'viewer',
    displayName: 'Auditor / Viewer',
    description: 'Read-only access to employee directory, payroll runs, payslips, and reports.',
    permissions: ['employees:read', 'payroll:read', 'attendance:read', 'reports:read']
  }
];

// Helper to hash passwords consistently
const hash = (p: string) => bcrypt.hashSync(p, 10);

const initialUsers: User[] = [
  {
    id: 'usr-admin-1',
    companyId: 'comp-101',
    username: 'admin',
    email: 'admin@apexpayroll.com',
    passwordHash: hash('AdminPassword123!'),
    firstName: 'Ahmad',
    lastName: 'Al-Admin',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'usr-hr-1',
    companyId: 'comp-101',
    username: 'hr_manager',
    email: 'hr@apexpayroll.com',
    passwordHash: hash('HrPassword123!'),
    firstName: 'Sarah',
    lastName: 'Al-Otaibi',
    role: 'hr_manager',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'usr-acc-1',
    companyId: 'comp-101',
    username: 'accountant',
    email: 'accountant@apexpayroll.com',
    passwordHash: hash('AccountantPassword123!'),
    firstName: 'Tariq',
    lastName: 'Ziyad',
    role: 'accountant',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'usr-fanar-admin',
    companyId: 'comp-102',
    username: 'fanar_admin',
    email: 'admin@fanargroup.com',
    passwordHash: hash('FanarPassword123!'),
    firstName: 'Sultan',
    lastName: 'Al-Fanar',
    role: 'admin',
    status: 'active',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z'
  }
];

// Initial seed data
const initialSeedData: DatabaseSchema = {
  config: defaultConfig,
  companies: initialCompanies,
  roles: initialRoles,
  users: initialUsers,
  departments: [
    { id: 'dept-1', companyId: 'comp-101', code: 'ENG', name: 'Software Engineering', headName: 'Ahmad Al-Mansoor', employeeCount: 4 },
    { id: 'dept-2', companyId: 'comp-101', code: 'HR', name: 'Human Resources', headName: 'Sarah Al-Otaibi', employeeCount: 2 },
    { id: 'dept-3', companyId: 'comp-101', code: 'FIN', name: 'Finance & Accounting', headName: 'Tariq Ziyad', employeeCount: 2 },
    { id: 'dept-4', companyId: 'comp-101', code: 'OPS', name: 'Operations & Logistics', headName: 'Fahad Al-Harbi', employeeCount: 2 },
    { id: 'dept-5', companyId: 'comp-102', code: 'SLS', name: 'Sales & Marketing', headName: 'Sultan Al-Fanar', employeeCount: 2 }
  ],
  employees: [
    {
      id: 'emp-101',
      companyId: 'comp-101',
      employeeCode: 'EMP-001',
      firstName: 'Mohammed',
      lastName: 'Al-Ghamdi',
      nationalId: encryptField('1010123456'),
      email: 'm.alghamdi@apexpayroll.com',
      phone: '+966 50 123 4567',
      department: 'Software Engineering',
      position: 'Senior Full Stack Engineer',
      joinDate: '2022-03-15',
      status: 'active',
      employmentType: 'full_time',
      bankName: 'Al Rajhi Bank',
      iban: encryptField('SA0380000000608010101001'),
      basicSalary: 18500,
      housingAllowance: 4625,
      transportAllowance: 1500,
      customAllowances: [{ id: 'a1', name: 'Mobile & Tech Allowance', amount: 500, isTaxable: true }],
      customDeductions: [],
      taxExempt: false,
      socialSecurityEnrolled: true,
      createdAt: '2022-03-15T08:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'emp-102',
      companyId: 'comp-101',
      employeeCode: 'EMP-002',
      firstName: 'Noura',
      lastName: 'Al-Qahtani',
      nationalId: encryptField('1020345678'),
      email: 'n.alqahtani@apexpayroll.com',
      phone: '+966 55 987 6543',
      department: 'Human Resources',
      position: 'HR Payroll Manager',
      joinDate: '2021-06-01',
      status: 'active',
      employmentType: 'full_time',
      bankName: 'SNB (National Commercial Bank)',
      iban: encryptField('SA1210000000405010202002'),
      basicSalary: 16000,
      housingAllowance: 4000,
      transportAllowance: 1200,
      customAllowances: [],
      customDeductions: [],
      taxExempt: false,
      socialSecurityEnrolled: true,
      createdAt: '2021-06-01T08:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'emp-103',
      companyId: 'comp-101',
      employeeCode: 'EMP-003',
      firstName: 'Khaled',
      lastName: 'Al-Salem',
      nationalId: encryptField('1030456789'),
      email: 'k.alsalem@apexpayroll.com',
      phone: '+966 54 321 0987',
      department: 'Finance & Accounting',
      position: 'Financial Controller',
      joinDate: '2020-01-10',
      status: 'active',
      employmentType: 'full_time',
      bankName: 'Riyad Bank',
      iban: encryptField('SA4520000000102030405003'),
      basicSalary: 21000,
      housingAllowance: 5250,
      transportAllowance: 1800,
      customAllowances: [{ id: 'a2', name: 'Executive Responsibility', amount: 1200, isTaxable: true }],
      customDeductions: [{ id: 'd1', name: 'Corporate Loan Repayment', amount: 800, isPreTax: false }],
      taxExempt: false,
      socialSecurityEnrolled: true,
      createdAt: '2020-01-10T08:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'emp-104',
      companyId: 'comp-101',
      employeeCode: 'EMP-004',
      firstName: 'Reem',
      lastName: 'Al-Dosari',
      nationalId: encryptField('1040567890'),
      email: 'r.aldosari@apexpayroll.com',
      phone: '+966 56 112 2334',
      department: 'Software Engineering',
      position: 'UI/UX Designer',
      joinDate: '2023-09-01',
      status: 'active',
      employmentType: 'full_time',
      bankName: 'Alinma Bank',
      iban: encryptField('SA8805000000223344556004'),
      basicSalary: 12500,
      housingAllowance: 3125,
      transportAllowance: 1000,
      customAllowances: [],
      customDeductions: [],
      taxExempt: false,
      socialSecurityEnrolled: true,
      createdAt: '2023-09-01T08:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'emp-105',
      companyId: 'comp-101',
      employeeCode: 'EMP-005',
      firstName: 'Omar',
      lastName: 'Hassan',
      nationalId: encryptField('1050678901'),
      email: 'o.hassan@apexpayroll.com',
      phone: '+966 59 887 7665',
      department: 'Operations & Logistics',
      position: 'Logistics Supervisor',
      joinDate: '2022-11-15',
      status: 'active',
      employmentType: 'full_time',
      bankName: 'Arab National Bank',
      iban: encryptField('SA6540000000998877665005'),
      basicSalary: 9500,
      housingAllowance: 2375,
      transportAllowance: 1000,
      customAllowances: [{ id: 'a3', name: 'Shift Hardship Allowance', amount: 600, isTaxable: true }],
      customDeductions: [],
      taxExempt: false,
      socialSecurityEnrolled: true,
      createdAt: '2022-11-15T08:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'emp-201',
      companyId: 'comp-102',
      employeeCode: 'FAN-001',
      firstName: 'Faisal',
      lastName: 'Al-Mutairi',
      nationalId: encryptField('1090112233'),
      email: 'faisal@fanargroup.com',
      phone: '+966 51 223 3445',
      department: 'Sales & Marketing',
      position: 'Sales Director',
      joinDate: '2021-04-10',
      status: 'active',
      employmentType: 'full_time',
      bankName: 'SABB Bank',
      iban: encryptField('SA1250000001090112233001'),
      basicSalary: 25000,
      housingAllowance: 6250,
      transportAllowance: 2000,
      customAllowances: [{ id: 'fa1', name: 'Sales Bonus Commission', amount: 3000, isTaxable: true }],
      customDeductions: [],
      taxExempt: false,
      socialSecurityEnrolled: true,
      createdAt: '2021-04-10T08:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'emp-202',
      companyId: 'comp-102',
      employeeCode: 'FAN-002',
      firstName: 'Lujain',
      lastName: 'Al-Shammari',
      nationalId: encryptField('1090445566'),
      email: 'lujain@fanargroup.com',
      phone: '+966 52 334 4556',
      department: 'Sales & Marketing',
      position: 'Marketing Specialist',
      joinDate: '2023-01-15',
      status: 'active',
      employmentType: 'full_time',
      bankName: 'Al Inma Bank',
      iban: encryptField('SA8805000001090445566002'),
      basicSalary: 14000,
      housingAllowance: 3500,
      transportAllowance: 1200,
      customAllowances: [],
      customDeductions: [],
      taxExempt: false,
      socialSecurityEnrolled: true,
      createdAt: '2023-01-15T08:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z'
    }
  ],
  attendance: [
    { id: 'att-101', companyId: 'comp-101', employeeId: 'emp-101', period: '2026-08', workingDays: 30, presentDays: 30, unpaidAbsenceDays: 0, overtimeHours: 12, updatedAt: '2026-08-05T12:00:00.000Z' },
    { id: 'att-102', companyId: 'comp-101', employeeId: 'emp-102', period: '2026-08', workingDays: 30, presentDays: 30, unpaidAbsenceDays: 0, overtimeHours: 4, updatedAt: '2026-08-05T12:00:00.000Z' },
    { id: 'att-103', companyId: 'comp-101', employeeId: 'emp-103', period: '2026-08', workingDays: 30, presentDays: 29, unpaidAbsenceDays: 1, overtimeHours: 0, updatedAt: '2026-08-05T12:00:00.000Z' },
    { id: 'att-104', companyId: 'comp-101', employeeId: 'emp-104', period: '2026-08', workingDays: 30, presentDays: 30, unpaidAbsenceDays: 0, overtimeHours: 8, updatedAt: '2026-08-05T12:00:00.000Z' },
    { id: 'att-105', companyId: 'comp-101', employeeId: 'emp-105', period: '2026-08', workingDays: 30, presentDays: 28, unpaidAbsenceDays: 2, overtimeHours: 18, updatedAt: '2026-08-05T12:00:00.000Z' },
    { id: 'att-201', companyId: 'comp-102', employeeId: 'emp-201', period: '2026-08', workingDays: 30, presentDays: 30, unpaidAbsenceDays: 0, overtimeHours: 10, updatedAt: '2026-08-05T12:00:00.000Z' },
    { id: 'att-202', companyId: 'comp-102', employeeId: 'emp-202', period: '2026-08', workingDays: 30, presentDays: 30, unpaidAbsenceDays: 0, overtimeHours: 5, updatedAt: '2026-08-05T12:00:00.000Z' }
  ],
  payrollRuns: [],
  auditLogs: [
    {
      id: 'log-1',
      companyId: 'comp-101',
      timestamp: new Date().toISOString(),
      action: 'DATABASE_MIGRATION',
      user: 'System Migration Agent',
      details: 'Initialized database schema, default multi-tenant configurations and companies.',
      module: 'System'
    }
  ],
  journalEntries: [
    {
      id: 'je-101',
      companyId: 'comp-101',
      runId: 'pr-2026-06',
      runCode: 'PAY-202606',
      reference: 'PAY-202606',
      period: '2026-06',
      status: 'confirmed',
      retryCount: 1,
      maxRetries: 5,
      totalDebit: 86800,
      totalCredit: 86800,
      transactionId: 'TX-ACC-202606-991',
      journalData: {
        reference: 'PAY-202606',
        date: '2026-06-30',
        currency: 'SAR',
        description: 'Payroll Processing Journal for Period 2026-06 (PAY-202606)',
        lines: [
          { accountCode: '5101', accountName: 'Salaries & Allowances Expense', type: 'debit', amount: 77500 },
          { accountCode: '5105', accountName: 'Employer GOSI Contribution Expense', type: 'debit', amount: 9300 },
          { accountCode: '2101', accountName: 'Net Payroll Payable (WPS)', type: 'credit', amount: 69750 },
          { accountCode: '2105', accountName: 'GOSI Payable (Employee + Employer)', type: 'credit', amount: 17050 }
        ]
      },
      createdAt: '2026-06-30T10:00:00Z',
      updatedAt: '2026-06-30T10:05:00Z',
      sentAt: '2026-06-30T10:05:00Z'
    },
    {
      id: 'je-102',
      companyId: 'comp-101',
      runId: 'pr-2026-07',
      runCode: 'PAY-202607',
      reference: 'PAY-202607',
      period: '2026-07',
      status: 'sent',
      retryCount: 1,
      maxRetries: 5,
      totalDebit: 89200,
      totalCredit: 89200,
      transactionId: 'TX-ACC-202607-402',
      journalData: {
        reference: 'PAY-202607',
        date: '2026-07-31',
        currency: 'SAR',
        description: 'Payroll Processing Journal for Period 2026-07 (PAY-202607)',
        lines: [
          { accountCode: '5101', accountName: 'Salaries & Allowances Expense', type: 'debit', amount: 79500 },
          { accountCode: '5105', accountName: 'Employer GOSI Contribution Expense', type: 'debit', amount: 9700 },
          { accountCode: '2101', accountName: 'Net Payroll Payable (WPS)', type: 'credit', amount: 71500 },
          { accountCode: '2105', accountName: 'GOSI Payable (Employee + Employer)', type: 'credit', amount: 17700 }
        ]
      },
      createdAt: '2026-07-31T10:00:00Z',
      updatedAt: '2026-07-31T10:02:00Z',
      sentAt: '2026-07-31T10:02:00Z'
    },
    {
      id: 'je-103',
      companyId: 'comp-101',
      runId: 'pr-2026-08',
      runCode: 'PAY-202608',
      reference: 'PAY-202608',
      period: '2026-08',
      status: 'failed',
      retryCount: 2,
      maxRetries: 5,
      totalDebit: 86800,
      totalCredit: 86800,
      lastError: 'Accounting API Gateway Timeout (504): Connection timed out after 2000ms',
      journalData: {
        reference: 'PAY-202608',
        date: '2026-08-01',
        currency: 'SAR',
        description: 'Payroll Processing Journal for Period 2026-08 (PAY-202608)',
        lines: [
          { accountCode: '5101', accountName: 'Salaries & Allowances Expense', type: 'debit', amount: 77500 },
          { accountCode: '5105', accountName: 'Employer GOSI Contribution Expense', type: 'debit', amount: 9300 },
          { accountCode: '2101', accountName: 'Net Payroll Payable (WPS)', type: 'credit', amount: 69750 },
          { accountCode: '2105', accountName: 'GOSI Payable (Employee + Employer)', type: 'credit', amount: 17050 }
        ]
      },
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-05T14:30:00Z'
    },
    {
      id: 'je-201',
      companyId: 'comp-102',
      runId: 'pr-2026-08-fanar',
      runCode: 'PAY-FANAR-202608',
      reference: 'PAY-FANAR-202608',
      period: '2026-08',
      status: 'confirmed',
      retryCount: 1,
      maxRetries: 5,
      totalDebit: 58500,
      totalCredit: 58500,
      transactionId: 'TX-FANAR-202608-01',
      journalData: {
        reference: 'PAY-FANAR-202608',
        date: '2026-08-01',
        currency: 'SAR',
        description: 'Payroll Journal Al-Fanar Trading (PAY-FANAR-202608)',
        lines: [
          { accountCode: '5201', accountName: 'تكلفة أجور موظفي المجموعة', type: 'debit', amount: 52950 },
          { accountCode: '5205', accountName: 'حصة التأمينات الاجتماعية لشركة الفنار', type: 'debit', amount: 5550 },
          { accountCode: '2201', accountName: 'حساب مستحقات رواتب البنوك', type: 'credit', amount: 48250 },
          { accountCode: '2205', accountName: 'التزامات المؤسسة العامة للتأمينات', type: 'credit', amount: 10250 }
        ]
      },
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:05:00Z',
      sentAt: '2026-08-01T10:05:00Z'
    },
    {
      id: 'je-104',
      companyId: 'comp-101',
      runId: 'pr-2026-05',
      runCode: 'PAY-202605',
      reference: 'PAY-202605',
      period: '2026-05',
      status: 'failed',
      retryCount: 5,
      maxRetries: 5,
      totalDebit: 84000,
      totalCredit: 84000,
      lastError: 'Accounting API Error (500): Database connection pool exhausted on ERP endpoint',
      alertSent: true,
      journalData: {
        reference: 'PAY-202605',
        date: '2026-05-31',
        currency: 'SAR',
        description: 'Payroll Processing Journal for Period 2026-05 (PAY-202605)',
        lines: [
          { accountCode: '5101', accountName: 'Salaries & Allowances Expense', type: 'debit', amount: 75000 },
          { accountCode: '5105', accountName: 'Employer GOSI Contribution Expense', type: 'debit', amount: 9000 },
          { accountCode: '2101', accountName: 'Net Payroll Payable (WPS)', type: 'credit', amount: 67500 },
          { accountCode: '2105', accountName: 'GOSI Payable (Employee + Employer)', type: 'credit', amount: 16500 }
        ]
      },
      createdAt: '2026-05-31T09:00:00Z',
      updatedAt: '2026-08-05T15:00:00Z'
    },
    {
      id: 'je-105',
      companyId: 'comp-101',
      runId: 'pr-2026-09',
      runCode: 'PAY-202609',
      reference: 'PAY-202609',
      period: '2026-09',
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      totalDebit: 88000,
      totalCredit: 88000,
      journalData: {
        reference: 'PAY-202609',
        date: '2026-09-01',
        currency: 'SAR',
        description: 'Payroll Processing Journal for Period 2026-09 (PAY-202609)',
        lines: [
          { accountCode: '5101', accountName: 'Salaries & Allowances Expense', type: 'debit', amount: 78500 },
          { accountCode: '5105', accountName: 'Employer GOSI Contribution Expense', type: 'debit', amount: 9500 },
          { accountCode: '2101', accountName: 'Net Payroll Payable (WPS)', type: 'credit', amount: 70500 },
          { accountCode: '2105', accountName: 'GOSI Payable (Employee + Employer)', type: 'credit', amount: 17500 }
        ]
      },
      createdAt: '2026-08-06T01:00:00Z',
      updatedAt: '2026-08-06T01:00:00Z'
    }
  ]
};

let inMemoryData: DatabaseSchema | null = null;

export function getDatabase(): DatabaseSchema {
  if (inMemoryData) {
    return inMemoryData;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryData = JSON.parse(raw);
      if (!inMemoryData!.companies || inMemoryData!.companies.length === 0) {
        inMemoryData!.companies = initialCompanies;
      }
      if (!inMemoryData!.roles || inMemoryData!.roles.length === 0) {
        inMemoryData!.roles = initialRoles;
      }
      if (!inMemoryData!.users || inMemoryData!.users.length === 0) {
        inMemoryData!.users = initialUsers;
      }
      if (!inMemoryData!.journalEntries || inMemoryData!.journalEntries.length === 0) {
        inMemoryData!.journalEntries = initialSeedData.journalEntries;
      }
      if (inMemoryData!.employees) {
        inMemoryData!.employees.forEach((emp, index) => {
          if (!emp.companyId) emp.companyId = 'comp-101';
          if (!emp.nationalId) {
            emp.nationalId = encryptField(`10${index + 1}0123456`);
          } else if (!emp.nationalId.startsWith('ENC:GCM:')) {
            emp.nationalId = encryptField(emp.nationalId);
          }
          if (emp.iban && !emp.iban.startsWith('ENC:GCM:')) {
            emp.iban = encryptField(emp.iban);
          }
        });
      }
      if (inMemoryData!.payrollRuns) {
        inMemoryData!.payrollRuns.forEach(r => {
          if (!r.companyId) r.companyId = 'comp-101';
        });
      }
      if (inMemoryData!.journalEntries) {
        inMemoryData!.journalEntries.forEach(j => {
          if (!j.companyId) j.companyId = 'comp-101';
        });
      }
      return inMemoryData!;
    }
  } catch (err) {
    console.warn('Could not read JSON DB file, using initial memory state:', err);
  }

  inMemoryData = JSON.parse(JSON.stringify(initialSeedData));
  saveDatabase(inMemoryData!);
  return inMemoryData!;
}

export function saveDatabase(data: DatabaseSchema): void {
  inMemoryData = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist database to disk:', err);
  }
}

export function resetAndSeedDatabase(): DatabaseSchema {
  inMemoryData = JSON.parse(JSON.stringify(initialSeedData));
  saveDatabase(inMemoryData!);
  return inMemoryData!;
}
