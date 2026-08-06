export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contractor';
export type PaymentMethod = 'bank_transfer' | 'check' | 'cash';
export type PayrollStatus = 'draft' | 'calculated' | 'approved' | 'paid';

export type UserRole = 'admin' | 'hr_manager' | 'accountant' | 'viewer';

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface CompanyChartOfAccounts {
  salariesAccountCode: string;
  salariesAccountName: string;
  gosiExpenseAccountCode: string;
  gosiExpenseAccountName: string;
  payrollPayableAccountCode: string;
  payrollPayableAccountName: string;
  gosiPayableAccountCode: string;
  gosiPayableAccountName: string;
}

export interface CompanyWpsConfig {
  payerId: string;
  payerBankCode: string;
  payerIban: string;
  establishmentName: string;
}

export interface CompanyAccountingApiConfig {
  apiUrl: string;
  apiKey: string;
  autoSyncOnApproval: boolean;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  crNumber: string;
  currency: string;
  currencySymbol: string;
  chartOfAccounts: CompanyChartOfAccounts;
  wpsConfig: CompanyWpsConfig;
  accountingApiConfig: CompanyAccountingApiConfig;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  companyId?: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  refreshToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSafeProfile {
  id: string;
  companyId?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Allowance {
  id: string;
  name: string;
  amount: number;
  isTaxable: boolean;
}

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  isPreTax: boolean;
}

export interface Employee {
  id: string;
  companyId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  nationalId: string; // Encrypted at rest, masked in standard API responses
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  bankName: string;
  iban: string; // Encrypted at rest, masked in standard API responses
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  customAllowances: Allowance[];
  customDeductions: Deduction[];
  taxExempt: boolean;
  socialSecurityEnrolled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  companyId?: string;
  employeeId: string;
  period: string; // YYYY-MM
  workingDays: number;
  presentDays: number;
  unpaidAbsenceDays: number;
  overtimeHours: number;
  notes?: string;
  updatedAt: string;
}

export interface PayslipItem {
  code: string;
  label: string;
  category: 'earnings' | 'deductions' | 'employer_contribution';
  amount: number;
  description?: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  period: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  overtimePay: number;
  otherAllowances: number;
  grossPay: number;
  incomeTax: number;
  socialSecurityEmployee: number;
  socialSecurityEmployer: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  absentDays: number;
  overtimeHours: number;
  paymentMethod: PaymentMethod;
  bankIban: string;
  items: PayslipItem[];
  generatedAt: string;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  runCode: string;
  title: string;
  period: string; // YYYY-MM
  status: PayrollStatus;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  totalNetPay: number;
  payslips: Payslip[];
  createdAt: string;
  calculatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Department {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  headName: string;
  employeeCount: number;
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number; // percentage
}

export interface SystemConfig {
  companyName: string;
  currency: string;
  currencySymbol: string;
  socialSecurityEmployeeRate: number; // e.g. 0.09 (9%)
  socialSecurityEmployerRate: number; // e.g. 0.11 (11%)
  standardMonthlyWorkDays: number; // e.g. 22 or 30
  overtimeHourlyMultiplier: number; // e.g. 1.5
  taxBrackets: TaxBracket[];
  autoProcessSchedule: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  companyId?: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  module: string;
}

export interface WorkerJob {
  id: string;
  type: 'payroll_batch' | 'payslip_export' | 'tax_audit' | 'database_migration';
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  startedAt: string;
  completedAt?: string;
  logs: string[];
}

export type JournalEntryStatus = 'pending' | 'sent' | 'confirmed' | 'failed';

export interface AccountingJournalEntry {
  id: string;
  companyId: string;
  runId: string;
  runCode: string;
  reference: string;
  period: string; // YYYY-MM
  status: JournalEntryStatus;
  retryCount: number;
  maxRetries: number;
  totalDebit: number;
  totalCredit: number;
  journalData: {
    reference: string;
    date: string;
    currency: string;
    description: string;
    lines: Array<{
      accountCode: string;
      accountName: string;
      type: 'debit' | 'credit';
      amount: number;
    }>;
  };
  lastError?: string;
  transactionId?: string;
  alertSent?: boolean;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}
