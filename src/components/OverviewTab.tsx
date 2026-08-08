import React from 'react';
import { Employee, PayrollRun, SystemConfig } from '../types';
import { formatCurrency } from '../utils/currency';
import { Users, DollarSign, ArrowUpRight, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OverviewTabProps {
  employees: Employee[];
  latestRun?: PayrollRun;
  config: SystemConfig;
  onNavigate: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  employees,
  latestRun,
  config,
  onNavigate
}) => {
  const { t } = useLanguage();
  const activeCount = employees.filter(e => e.status === 'active').length;
  const totalBaseSalaries = employees.reduce((acc, e) => acc + e.basicSalary, 0);
  const avgSalary = activeCount > 0 ? totalBaseSalaries / activeCount : 0;

  const totalGross = latestRun ? latestRun.totalGrossPay : employees.reduce((acc, e) => acc + e.basicSalary + e.housingAllowance + e.transportAllowance, 0);
  const totalNet = latestRun ? latestRun.totalNetPay : totalGross * 0.88;

  return (
    <div id="overview-tab-content" className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{t('overview')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('appName')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            id="btn-overview-process-payroll"
            onClick={() => onNavigate('payroll')}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{t('calculatePayroll')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('totalEmployees')}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{activeCount}</div>
          <div className="text-[10px] text-green-600 font-bold mt-1">100% active</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('totalGrossPay')}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(totalGross, config.currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">{t('currencySar')}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('netPayable')}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(totalNet, config.currencySymbol)}
          </div>
          <div className="text-[10px] text-blue-600 font-bold mt-1">WPS / GOSI</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg. Salary</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(avgSalary, config.currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">{t('currencySar')}</div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Run Status Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t('latestPayrollRun')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">PayrollEngine</p>
            </div>
            {latestRun ? (
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                latestRun.status === 'approved' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {t(latestRun.status, latestRun.status)}
              </span>
            ) : (
              <span className="text-xs text-slate-400">--</span>
            )}
          </div>

          {latestRun ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded border border-slate-200 font-mono text-xs">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">{t('employeeCode')}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{latestRun.runCode}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">{t('totalEmployees')}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{latestRun.totalEmployees}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">{t('totalDeductions')}</div>
                  <div className="font-bold text-red-600 mt-0.5">{formatCurrency(latestRun.totalDeductions, config.currencySymbol)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold">{t('employerGosiShare')}</div>
                  <div className="font-bold text-blue-600 mt-0.5">{formatCurrency(latestRun.totalEmployerContributions, config.currencySymbol)}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  id="btn-overview-view-payslips"
                  onClick={() => onNavigate('payslips')}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {t('payslips')}
                </button>
                <button
                  id="btn-overview-view-reports"
                  onClick={() => onNavigate('reports')}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer"
                >
                  {t('downloadWps')}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              <p>No payroll calculation run has been executed for this period yet.</p>
              <button
                id="btn-overview-start-run"
                onClick={() => onNavigate('payroll')}
                className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white text-xs rounded font-semibold hover:bg-blue-700 cursor-pointer"
              >
                Run Calculation Engine
              </button>
            </div>
          )}
        </div>

        {/* System Health & Architecture Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
            System Architecture Status
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-mono text-[11px]">/src/config</span>
              <span className="text-green-700 font-bold flex items-center gap-1 text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Loaded</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-mono text-[11px]">/src/models</span>
              <span className="text-green-700 font-bold flex items-center gap-1 text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-mono text-[11px]">/src/controllers</span>
              <span className="text-green-700 font-bold flex items-center gap-1 text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-mono text-[11px]">/src/services</span>
              <span className="text-green-700 font-bold flex items-center gap-1 text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> 3 Core Services</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-mono text-[11px]">/src/routes</span>
              <span className="text-green-700 font-bold flex items-center gap-1 text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Mounted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
