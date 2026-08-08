import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Nav & Sidebar
    appName: 'نظام إدارة مسير الرواتب السعودي',
    overview: 'نظرة عامة',
    employees: 'إدارة الموظفين',
    payroll: 'معالجة الرواتب',
    payslips: 'قسائم الرواتب',
    attendance: 'الدوام والحضور',
    journal: 'القيود المحاسبية',
    companies: 'إدارة الشركات',
    reports: 'التقارير و WPS',
    auth: 'الأمان والتوثيق',
    architecture: 'هيكلية النظام',
    worker: 'وحدة المعالجة',
    settings: 'الإعدادات',

    // Header / Controls
    languageToggle: 'English',
    cycle: 'الدورة',
    expressBackend: 'محرك Express الخلفي',
    apiConnected: 'متصل بالـ API',
    apiConnecting: 'جاري الاتصال بالـ API...',
    runPayrollWorker: 'تشغيل معالج الرواتب',
    switchRole: 'تبديل الدور',
    logout: 'تسجيل الخروج',
    jwtSignIn: 'تسجيل الدخول (JWT)',

    // Common UI Labels
    search: 'بحث...',
    filter: 'تصفية',
    export: 'تصدير',
    download: 'تنزيل',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ والتحديث',
    cancel: 'إلغاء',
    status: 'الحالة',
    actions: 'الإجراءات',
    active: 'نشط',
    inactive: 'غير نشط',
    loading: 'جاري التحميل...',
    success: 'نجاح',
    error: 'خطأ',
    currencySar: 'ر.س',
    currency: 'SAR',
    period: 'الفترة',

    // Overview Tab
    totalEmployees: 'إجمالي الموظفين',
    saudiEmployees: 'الموظفون السعوديون',
    saudizationRate: 'نسبة السعودة',
    totalMonthlySalaries: 'إجمالي الرواتب الشهرية',
    gosiContributions: 'اشتراكات التأمينات (GOSI)',
    latestPayrollRun: 'آخر مسير رواتب',
    netPayable: 'صافي الرواتب المستحقة',
    approved: 'معتمد',
    draft: 'مسودة',
    calculated: 'محسوب',
    paid: 'مدفوع',
    quickActions: 'إجراءات سريعة',
    calculatePayroll: 'احتساب مسير الشهر',
    addNewEmployee: 'إضافة موظف جديد',
    downloadWps: 'تنزيل ملف حماية الأجور (WPS)',
    viewJournalEntries: 'عرض القيود المحاسبية',

    // Employee Tab
    employeeDirectory: 'دليل الموظفين',
    addEmployeeTitle: 'إضافة موظف جديد',
    employeeCode: 'كود الموظف',
    fullName: 'الاسم الكامل',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    nationalId: 'الهوية الوطنية / الإقامة',
    department: 'القسم',
    position: 'المسمى الوظيفي',
    nationality: 'الجنسية',
    saudiNational: 'سعودي الجنسية',
    nonSaudi: 'مقيم / غير سعودي',
    baseSalary: 'الراتب الأساسي',
    housingAllowance: 'بدل السكن',
    transportAllowance: 'بدل النقل',
    otherAllowances: 'بدلات أخرى',
    totalSalary: 'إجمالي الراتب',
    bankName: 'اسم البنك',
    ibanNumber: 'رقم الآيبان (IBAN)',
    joinDate: 'تاريخ الالتحاق',
    confirmDeleteEmployee: 'هل أنت تأكد من رغبتك في حذف هذا الموظف؟',

    // Payroll Processing
    payrollEngine: 'محرك احتساب الرواتب والامتثال لنظام العمل',
    calculatePayrollCurrentPeriod: 'احتساب مسير الرواتب للدورة الحالية',
    calculateNow: 'احتساب المسير الآن',
    approveAndGenerateJournals: 'اعتماد المسير وتوليد القيود',
    payrollRunHistory: 'سجل المسيرات السابقة',
    totalGrossPay: 'إجمالي الاستحقاقات',
    totalDeductions: 'إجمالي الاستقطاعات',
    employerGosiShare: 'حصة الشركة في التأمينات',
    employeeGosiShare: 'حصة الموظف في التأمينات',
    netSalarySum: 'إجمالي صافي الرواتب',

    // Payslips Tab
    payslipViewer: 'قسائم الرواتب الفردية للموظفين',
    selectEmployeePlaceholder: '-- اختر الموظف لعرض القسيمة --',
    earningsBreakdown: 'تفاصيل الاستحقاقات (الراتب والبدلات)',
    deductionsBreakdown: 'تفاصيل الاستقطاعات (التأمينات والجزاءات)',
    printPayslip: 'طباعة قسيمة الراتب',

    // Attendance Tab
    attendanceManagement: 'إدارة الحضور والانصراف والغياب',
    workingDaysCount: 'أيام العمل الفعلية',
    overtimeHoursCount: 'ساعات العمل الإضافي',
    absenceDaysCount: 'أيام الغياب بدون عذر',

    // Journal Entries Tab
    doubleEntryJournals: 'القيود المحاسبية الآلية المزدوجة',
    chartOfAccountsMapping: 'ربط دليل الحسابات مع نظام ERP',
    syncStatus: 'حالة الترحيل المحاسبي',
    debitAmount: 'مدين',
    creditAmount: 'دائن',
    reSyncJournal: 'إعادة ترحيل القيد',

    // Company Management
    multiTenantEngine: 'نظام إدارة الشركات المتعددة (Multi-Tenant)',
    companyNameLabel: 'اسم الشركة',
    crNumberLabel: 'رقم السجل التجاري',
    testErpIntegration: 'اختبار الربط مع نظام ERP',

    // Reports Tab
    reportsAndCompliance: 'التقارير والامتثال الحكومي (WPS & GOSI)',
    wpsSifFileExport: 'تصدير ملف حماية الأجور الوزاري (SIF File)',
    auditLogTrail: 'سجل العمليات والتدقيق',

    // Settings
    systemSettingsTitle: 'إعدادات النظام والتأمينات الاجتماعية',
    gosiSaudiRate: 'نسبة التأمينات للسعوديين (%)',
    gosiNonSaudiRate: 'نسبة التأمينات لغير السعوديين (%)',
    wpsPayerId: 'رقم المنشأة في حماية الأجور (Payer ID)',
  },
  en: {
    // Nav & Sidebar
    appName: 'Saudi Payroll & ERP Journal System',
    overview: 'Overview',
    employees: 'Employees',
    payroll: 'Payroll Processing',
    payslips: 'Payslips',
    attendance: 'Attendance',
    journal: 'Accounting Journals',
    companies: 'Companies Management',
    reports: 'Reports & WPS',
    auth: 'Auth & Security',
    architecture: 'Architecture',
    worker: 'Worker Service',
    settings: 'Settings',

    // Header / Controls
    languageToggle: 'العربية',
    cycle: 'Cycle',
    expressBackend: 'Express Backend Engine',
    apiConnected: 'API Connected',
    apiConnecting: 'Connecting API...',
    runPayrollWorker: 'Run Payroll Worker',
    switchRole: 'Switch Role',
    logout: 'Logout',
    jwtSignIn: 'JWT Sign In',

    // Common UI Labels
    search: 'Search...',
    filter: 'Filter',
    export: 'Export',
    download: 'Download',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save Changes',
    cancel: 'Cancel',
    status: 'Status',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    currencySar: 'SAR',
    currency: 'SAR',
    period: 'Period',

    // Overview Tab
    totalEmployees: 'Total Employees',
    saudiEmployees: 'Saudi Employees',
    saudizationRate: 'Saudization Rate',
    totalMonthlySalaries: 'Total Monthly Salaries',
    gosiContributions: 'GOSI Contributions',
    latestPayrollRun: 'Latest Payroll Run',
    netPayable: 'Net Payable Payroll',
    approved: 'Approved',
    draft: 'Draft',
    calculated: 'Calculated',
    paid: 'Paid',
    quickActions: 'Quick Actions',
    calculatePayroll: 'Calculate Monthly Payroll',
    addNewEmployee: 'Add New Employee',
    downloadWps: 'Download WPS SIF File',
    viewJournalEntries: 'View Accounting Journals',

    // Employee Tab
    employeeDirectory: 'Employee Directory',
    addEmployeeTitle: 'Add New Employee',
    employeeCode: 'Employee Code',
    fullName: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    nationalId: 'National ID / Iqama',
    department: 'Department',
    position: 'Position',
    nationality: 'Nationality',
    saudiNational: 'Saudi National',
    nonSaudi: 'Resident / Non-Saudi',
    baseSalary: 'Base Salary',
    housingAllowance: 'Housing Allowance',
    transportAllowance: 'Transport Allowance',
    otherAllowances: 'Other Allowances',
    totalSalary: 'Total Package',
    bankName: 'Bank Name',
    ibanNumber: 'IBAN Number',
    joinDate: 'Join Date',
    confirmDeleteEmployee: 'Are you sure you want to delete this employee?',

    // Payroll Processing
    payrollEngine: 'Payroll Calculation & Labor Law Compliance Engine',
    calculatePayrollCurrentPeriod: 'Calculate Payroll for Current Cycle',
    calculateNow: 'Calculate Now',
    approveAndGenerateJournals: 'Approve & Generate Journals',
    payrollRunHistory: 'Payroll Run History',
    totalGrossPay: 'Total Gross Pay',
    totalDeductions: 'Total Deductions',
    employerGosiShare: 'Employer GOSI Share',
    employeeGosiShare: 'Employee GOSI Share',
    netSalarySum: 'Total Net Pay',

    // Payslips Tab
    payslipViewer: 'Individual Employee Payslips',
    selectEmployeePlaceholder: '-- Select Employee to View Payslip --',
    earningsBreakdown: 'Earnings Breakdown (Base & Allowances)',
    deductionsBreakdown: 'Deductions Breakdown (GOSI & Deductions)',
    printPayslip: 'Print Payslip',

    // Attendance Tab
    attendanceManagement: 'Attendance, Overtime & Leave Tracking',
    workingDaysCount: 'Actual Working Days',
    overtimeHoursCount: 'Overtime Hours',
    absenceDaysCount: 'Unexcused Absence Days',

    // Journal Entries Tab
    doubleEntryJournals: 'Automated Double-Entry Journals',
    chartOfAccountsMapping: 'Chart of Accounts & ERP Integration',
    syncStatus: 'ERP Sync Status',
    debitAmount: 'Debit',
    creditAmount: 'Credit',
    reSyncJournal: 'Re-Sync Journal',

    // Company Management
    multiTenantEngine: 'Multi-Tenant Company Management',
    companyNameLabel: 'Company Name',
    crNumberLabel: 'CR Number',
    testErpIntegration: 'Test ERP Integration API',

    // Reports Tab
    reportsAndCompliance: 'Compliance & Government Reports (WPS & GOSI)',
    wpsSifFileExport: 'Export Wage Protection SIF File',
    auditLogTrail: 'Audit Log & Security Trail',

    // Settings
    systemSettingsTitle: 'System & GOSI Configuration',
    gosiSaudiRate: 'Saudi GOSI Contribution Rate (%)',
    gosiNonSaudiRate: 'Non-Saudi GOSI Rate (%)',
    wpsPayerId: 'WPS Establishment ID (Payer ID)',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRtl: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
